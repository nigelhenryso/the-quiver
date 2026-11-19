import type { SupabaseClient } from '@supabase/supabase-js';
import {
  INVENTORY_TABLE,
  ORDER_TABLE,
  ORGANIZATION_TABLE,
  PAYMENT_MODE_TABLE,
  PAYMENT_TABLE,
  PRODUCT_IMAGE_TABLE,
  PRODUCT_TABLE,
  STUDENT_TABLE,
  VARIANT_OPTION_TABLE,
  VARIANT_TYPE_TABLE,
} from '@/src/lib/supabase/tables';
import type { Inventory } from '@/src/types/Inventory';
import type { Order } from '@/src/types/Order';
import type { Organization } from '@/src/types/Organization';
import type { Payment } from '@/src/types/Payment';
import type { PaymentMode } from '@/src/types/PaymentMode';
import type { Product } from '@/src/types/Product';
import type { ProductImage } from '@/src/types/ProductImage';
import type { Student } from '@/src/types/Student';
import type { VariantOption } from '@/src/types/VariantOption';
import type { VariantType } from '@/src/types/VariantType';
import type {
  DashboardStats,
  OrgDashboard,
  RecentOrder,
  SalesByPeriod,
  SalesPeriod,
} from '@/src/types/Dashboard';

const RECENT_ORDER_COUNT = 5;

// Periods follow Philippine time (UTC+8, no DST)
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Start of the current week (Mon) / month / year in Manila time, as a UTC Date. */
export function periodStart(period: SalesPeriod, now: Date = new Date()): Date {
  const local = new Date(now.getTime() + MANILA_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  let startUtc: number;
  if (period === 'Yearly') startUtc = Date.UTC(y, 0, 1);
  else if (period === 'Monthly') startUtc = Date.UTC(y, m, 1);
  else startUtc = Date.UTC(y, m, d - ((local.getUTCDay() + 6) % 7)); // back to Monday

  return new Date(startUtc - MANILA_OFFSET_MS);
}

const orderTotal = (o: Pick<Order, 'quantity' | 'unit_price_sold'>) =>
  o.quantity * Number(o.unit_price_sold);

/** Throws on a Supabase error so the page's error boundary shows it. */
function unwrap<T>(res: { data: unknown; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Failed to load ${what}: ${res.error.message}`);
  return (res.data ?? []) as T;
}

/**
 * Loads everything the org dashboard shows, for the org whose id = auth user id.
 * Queries tables separately (no embeds) so it doesn't depend on FK relationships being declared.
 */
export async function getOrgDashboard(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgDashboard | null> {
  const { data: org, error: orgError } = await supabase
    .from(ORGANIZATION_TABLE)
    .select('organization_id, name')
    .eq('organization_id', organizationId)
    .maybeSingle<Pick<Organization, 'organization_id' | 'name'>>();
  if (orgError) throw new Error(`Failed to load organization: ${orgError.message}`);
  if (!org) return null;

  // Organization -> Product -> Inventory -> Order
  const products = unwrap<Pick<Product, 'product_id' | 'name'>[]>(
    await supabase.from(PRODUCT_TABLE).select('product_id, name').eq('organization_id', organizationId),
    'products',
  );
  const empty: OrgDashboard = {
    orgName: org.name,
    stats: { pendingPaymentVerification: 0, pendingClaim: 0, completedThisMonth: 0, totalOrdersThisMonth: 0 },
    salesByPeriod: { Weekly: 0, Monthly: 0, Yearly: 0 },
    recentOrders: [],
  };
  if (products.length === 0) {
    if (process.env.NODE_ENV !== 'production')
      console.warn(`[dashboard] no Product rows visible for org ${organizationId} - check Product RLS (supabase/policies/org_dashboard_read.sql)`);
    return empty;
  }

  const inventory = unwrap<Pick<Inventory, 'inventory_id' | 'product_id' | 'variant_id'>[]>(
    await supabase
      .from(INVENTORY_TABLE)
      .select('inventory_id, product_id, variant_id')
      .in('product_id', products.map((p) => p.product_id)),
    'inventory',
  );
  if (inventory.length === 0) {
    if (process.env.NODE_ENV !== 'production')
      console.warn(`[dashboard] ${products.length} products but no Inventory rows visible - check Inventory RLS`);
    return empty;
  }

  const orders = unwrap<Order[]>(
    await supabase
      .from(ORDER_TABLE)
      .select('order_id, inventory_id, student_id, quantity, unit_price_sold, placed_at, status')
      .in('inventory_id', inventory.map((i) => i.inventory_id))
      .order('placed_at', { ascending: false }),
    'orders',
  );
  if (orders.length === 0) {
    if (process.env.NODE_ENV !== 'production')
      console.warn(`[dashboard] ${inventory.length} inventory rows but no Order rows visible - check Order RLS`);
    return empty;
  }

  const recent = orders.slice(0, RECENT_ORDER_COUNT);
  const pending = orders.filter((o) => o.status === 'Pending');

  // payments are only needed for pending orders (verification count) and the recent list
  const paymentOrderIds = [...new Set([...pending, ...recent].map((o) => o.order_id))];
  const [payments, paymentModes] = await Promise.all([
    supabase
      .from(PAYMENT_TABLE)
      .select('payment_id, order_id, payment_mode_id, amount, made_at')
      .in('order_id', paymentOrderIds)
      .then((r) => unwrap<Payment[]>(r, 'payments')),
    supabase
      .from(PAYMENT_MODE_TABLE)
      .select('payment_mode_id, name, type')
      .then((r) => unwrap<PaymentMode[]>(r, 'payment modes')),
  ]);
  const modeById = new Map(paymentModes.map((m) => [m.payment_mode_id, m]));
  const paymentsByOrder = new Map<string, Payment[]>();
  for (const p of payments) paymentsByOrder.set(p.order_id, [...(paymentsByOrder.get(p.order_id) ?? []), p]);

  // ---- stats
  const now = new Date();
  const monthStart = periodStart('Monthly', now);
  const thisMonth = orders.filter((o) => new Date(o.placed_at) >= monthStart);

  const stats: DashboardStats = {
    pendingPaymentVerification: pending.filter((o) =>
      (paymentsByOrder.get(o.order_id) ?? []).some((p) => modeById.get(p.payment_mode_id)?.type === 'Digital'),
    ).length,
    pendingClaim: orders.filter((o) => o.status === 'R4P').length,
    completedThisMonth: thisMonth.filter((o) => o.status === 'Claimed').length,
    totalOrdersThisMonth: thisMonth.length,
  };

  // sales = value of Claimed orders placed within the period
  const claimed = orders.filter((o) => o.status === 'Claimed');
  const salesByPeriod = (['Weekly', 'Monthly', 'Yearly'] as const).reduce((acc, period) => {
    const start = periodStart(period, now);
    acc[period] = claimed
      .filter((o) => new Date(o.placed_at) >= start)
      .reduce((sum, o) => sum + orderTotal(o), 0);
    return acc;
  }, {} as SalesByPeriod);

  // ---- recent orders: look up customer, variant, image
  const invById = new Map(inventory.map((i) => [i.inventory_id, i]));
  const productById = new Map(products.map((p) => [p.product_id, p]));
  const recentInv = recent.map((o) => invById.get(o.inventory_id)!);
  const variantIds = [...new Set(recentInv.map((i) => i.variant_id).filter((v): v is string => !!v))];
  const recentProductIds = [...new Set(recentInv.map((i) => i.product_id))];
  const studentIds = [...new Set(recent.map((o) => o.student_id))];

  const [students, variants, productImages] = await Promise.all([
    // NOTE: Student RLS currently only allows students to read their own row,
    // so this returns [] for orgs until a policy allows it (customerName falls back to null)
    supabase
      .from(STUDENT_TABLE)
      .select('student_id, first_name, last_name')
      .in('student_id', studentIds)
      .then((r) => unwrap<Pick<Student, 'student_id' | 'first_name' | 'last_name'>[]>(r, 'students')),
    variantIds.length
      ? supabase
          .from(VARIANT_OPTION_TABLE)
          .select('variant_id, variant_type_id, name, image_url')
          .in('variant_id', variantIds)
          .then((r) => unwrap<VariantOption[]>(r, 'variants'))
      : Promise.resolve([] as VariantOption[]),
    supabase
      .from(PRODUCT_IMAGE_TABLE)
      .select('product_image_id, product_id, image_url')
      .in('product_id', recentProductIds)
      .then((r) => unwrap<ProductImage[]>(r, 'product images')),
  ]);

  const typeIds = [...new Set(variants.map((v) => v.variant_type_id))];
  const variantTypes = typeIds.length
    ? unwrap<VariantType[]>(
        await supabase.from(VARIANT_TYPE_TABLE).select('variant_type_id, name').in('variant_type_id', typeIds),
        'variant types',
      )
    : [];

  const studentById = new Map(students.map((s) => [s.student_id, s]));
  const variantById = new Map(variants.map((v) => [v.variant_id, v]));
  const typeById = new Map(variantTypes.map((t) => [t.variant_type_id, t]));
  const imageByProduct = new Map<string, string>();
  for (const img of productImages) if (!imageByProduct.has(img.product_id)) imageByProduct.set(img.product_id, img.image_url);

  const recentOrders: RecentOrder[] = recent.map((o) => {
    const inv = invById.get(o.inventory_id)!;
    const student = studentById.get(o.student_id);
    const variant = inv.variant_id ? variantById.get(inv.variant_id) : undefined;
    const variantType = variant ? typeById.get(variant.variant_type_id) : undefined;
    const payment = paymentsByOrder.get(o.order_id)?.[0];
    const customerName = student
      ? [student.first_name, student.last_name].filter(Boolean).join(' ') || null
      : null;

    return {
      orderId: o.order_id,
      placedAt: o.placed_at,
      customerName,
      productName: productById.get(inv.product_id)?.name ?? 'Unknown product',
      variantLabel: variant?.name ? (variantType ? `${variantType.name}: ${variant.name}` : variant.name) : null,
      quantity: o.quantity,
      paymentModeName: payment ? (modeById.get(payment.payment_mode_id)?.name ?? null) : null,
      status: o.status,
      total: orderTotal(o),
      imageUrl: variant?.image_url ?? imageByProduct.get(inv.product_id) ?? null,
    };
  });

  return { orgName: org.name, stats, salesByPeriod, recentOrders };
}

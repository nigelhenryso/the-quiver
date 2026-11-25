import type { SupabaseClient } from "@supabase/supabase-js";
import { ORDER_INVENTORY_TABLE, ORDER_TABLE, ORGANIZATION_TABLE } from "@/src/lib/supabase/tables";
import { lineImage, lineLabel, productName, type LineRow } from "@/src/services/dashboardService";
import { resolveProductMedia } from "@/src/services/productMedia";
import type { OrderStatus } from "@/src/types/enums";
import type { OrgSales, SalesLine, SalesOrder } from "@/src/types/Sales";

const UNCATEGORIZED = "Uncategorized";

type SalesLineRow = LineRow & { // maps the inventory to the variants and variant types it contains as well as the product it belongs to
  Inventory: {
    ProductVariantCombination: {
      product_id: string;
      Product: { ProductTag: { Tag: { name: string } | null }[] } | null;
    } | null;
  } | null;
};

type OrderRow = { // maps the order to the student who placed it and the payment modes used
  order_id: string;
  status: OrderStatus | null;
  placed_at: string;
  Student: { first_name: string | null; last_name: string | null } | null;
  Payment: { PaymentMode: { name: string } | null }[];
};

function category(line: SalesLineRow) {
  const tags = (line.Inventory?.ProductVariantCombination?.Product?.ProductTag ?? [])
    .map((t) => t.Tag?.name?.trim())
    .filter((name): name is string => Boolean(name))
    .sort();
  return tags[0] ?? UNCATEGORIZED; // if multiple tags, pick the first alphabetically; if none, use "Uncategorized"
}

function coverImage(line: SalesLineRow) { // product-level cover (position 0) so the best seller doesn't show one variant's photo
  const images = line.Inventory?.ProductVariantCombination?.Product?.ProductImage ?? [];
  return (images.find((i) => i.position === 0) ?? images[0])?.image_url ?? null;
}

function toSalesLine(line: SalesLineRow): SalesLine { // per row mapping of inventory to the variants and variant types it contains as well as the product it belongs to
  const combo = line.Inventory?.ProductVariantCombination;
  return {
    productId: combo?.product_id ?? "",
    productName: productName(combo?.Product?.name ?? "Item"),
    category: category(line),
    image: coverImage(line) ?? lineImage(line),
    variants: (combo?.CombinationOption ?? [])
      .map((o) => o.VariantOption?.name?.trim())
      .filter((name): name is string => Boolean(name))
      .sort(),
    label: lineLabel(line),
    quantity: Number(line.quantity),
    total: Number(line.total_cost),
  };
}

/**
 * Every order containing this org's items, with the org's lines, customer and payment modes.
 * Date-range / status filtering happens on the page.
 * @param supabase - server Supabase client (logged in as the org)
 * @param orgId - the org's organization_id (= its auth user id)
 * @returns the sales data, or null if the org row doesn't exist
 */
export async function getOrgSales(supabase: SupabaseClient, orgId: string): Promise<OrgSales | null> {
  const [{ data: org }, { data: lineData, error: lineError }] = await Promise.all([
    supabase.from(ORGANIZATION_TABLE).select("name, acronym").eq("organization_id", orgId).maybeSingle(),
    supabase
      .from(ORDER_INVENTORY_TABLE)
      .select(
        "order_id, quantity, total_cost, Inventory(ProductVariantCombination(product_id, image_url, Product(name, organization_id, ProductImage(image_url, position), ProductTag(Tag(name))), CombinationOption(VariantOption(name, VariantTypes(name)))))",
      )
      .returns<SalesLineRow[]>(),
  ]); //gets an organization'sorders from the order_inventory table and maps them to the variants and variant types it contains as well as the product it belongs to

  if (!org) return null;
  if (lineError) throw lineError;

  const linesByOrder = new Map<string, SalesLine[]>(); // maps order_id -> lines of this org in that order
  for (const line of lineData ?? []) {
    if (line.Inventory?.ProductVariantCombination?.Product?.organization_id !== orgId) continue;
    const list = linesByOrder.get(line.order_id) ?? [];
    list.push(toSalesLine(line));
    linesByOrder.set(line.order_id, list);
  }

  const orderIds = [...linesByOrder.keys()]; // get all order_ids that contain this org's items
  let orders: OrderRow[] = [];
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from(ORDER_TABLE)
      .select("order_id, status, placed_at, Student!Order_student_id_fkey(first_name, last_name), Payment(PaymentMode(name))")
      .in("order_id", orderIds)
      .order("placed_at", { ascending: false })
      .returns<OrderRow[]>();
    if (error) throw error;
    orders = data ?? [];
  }

  const salesOrders: SalesOrder[] = orders.map((o) => { // maps the order to the student who placed it and the payment modes used
    const lines = linesByOrder.get(o.order_id) ?? [];
    const name = [o.Student?.first_name, o.Student?.last_name].filter(Boolean).join(" ");
    const modes = o.Payment.map((p) => p.PaymentMode?.name).filter((m): m is string => Boolean(m));
    return {
      orderId: o.order_id,
      placedAt: o.placed_at,
      status: o.status,
      customerName: name || "Customer",
      paymentModes: [...new Set(modes)],
      lines,
      total: lines.reduce((sum, l) => sum + l.total, 0),
    };
  });

  // storage paths ("product-media/...") -> signed URLs
  const resolveImage = await resolveProductMedia(supabase, salesOrders.flatMap((o) => o.lines.map((l) => l.image)));
  for (const order of salesOrders) for (const l of order.lines) l.image = resolveImage(l.image);

  return { orgName: org.acronym || org.name, orders: salesOrders };
}

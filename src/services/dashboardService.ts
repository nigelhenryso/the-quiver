import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ORDER_INVENTORY_TABLE,
  ORDER_TABLE,
  ORGANIZATION_TABLE,
} from "@/src/lib/supabase/tables";
import type { OrderStatus } from "@/src/types/enums";
import type { MonthlyCompletion, OrgDashboard, RecentOrder } from "@/src/types/Dashboard";

const TIME_ZONE = "Asia/Manila";
const MONTHS_SHOWN = 4; 
const RECENT_ORDERS = 5;

type LineRow = {
  order_id: string;
  quantity: number;
  total_cost: number;
  Inventory: {
    ProductVariantCombination: {
      image_url: string | null;
      Product: { name: string; organization_id: string; ProductImage: { image_url: string }[] } | null;
      CombinationOption: {
        VariantOption: { name: string | null; VariantTypes: { name: string } | null } | null;
      }[];
    } | null;
  } | null;
};

type OrderRow = {
  order_id: string;
  status: OrderStatus | null;
  placed_at: string;
  Student: { first_name: string | null; last_name: string | null } | null;
  Payment: { amount: number; made_at: string; PaymentMode: { name: string } | null }[];
};

function manilaYearMonth(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "numeric" })
    .formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") };
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 15)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const capitalize = (text: string) => text.trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

const productName = (name: string) => capitalize(name.replace(/(\w)\s+-\s+(\w)/g, "$1-$2"));

/**
 * Properly capitalizes the names of the products and variant types and variant options
 * @param option - the order mapped down to product variants
 * @returns a string that contains the product name along with the variant(s) and the quantity ordered
 */

function variantName(option: { name: string | null; VariantTypes: { name: string } | null }) {
  const name = option.name?.trim();
  if (!name) return null;
  const type = option.VariantTypes?.name?.trim();
  return type ? `${capitalize(type)}: ${capitalize(name)}` : capitalize(name);
}

/**
 * Stringifies and concatenates the ordered product along with the variant types, variant options, and quatities
 * @param line - the order mapped down to product variants
 * @returns a string that contains the product name along with the variant(s) and the quantity ordered
 */

function lineLabel(line: LineRow) {
  const combo = line.Inventory?.ProductVariantCombination;
  const name = productName(combo?.Product?.name ?? "Item");
  const variant = (combo?.CombinationOption ?? [])
    .map((o) => (o.VariantOption ? variantName(o.VariantOption) : null))
    .filter((v): v is string => Boolean(v))
    .sort() 
    .join(", ");
  return `${name}${variant ? ` - ${variant}` : ""} - ${line.quantity}x`;
}

/**
 * Gets the images of the product along with the product of the variants
 * @param line - the order mapped down to product variants
 * @returns an object that contains the first product image along with the respective images of the variants
 */

function lineImage(line: LineRow) {
  const combo = line.Inventory?.ProductVariantCombination;
  return (
    combo?.image_url ??
    combo?.Product?.ProductImage[0]?.image_url ??
    null
  );
}

/**
 * Everything the org dashboard shows, for one organization.
 * RLS already limits OrderInventory to this org's items, and Order/Payment/Student to orders that contain them.
 * @param supabase - server Supabase client (logged in as the org)
 * @param orgId - the org's organization_id (= its auth user id)
 * @returns the dashboard data, or null if the org row doesn't exist
 */
export async function getOrgDashboard(
  supabase: SupabaseClient,
  orgId: string,
  now: Date = new Date(),
): Promise<OrgDashboard | null> {
  const [{ data: org }, { data: lineData, error: lineError }] = await Promise.all([
    supabase.from(ORGANIZATION_TABLE).select("name, acronym").eq("organization_id", orgId).maybeSingle(),
    supabase
      .from(ORDER_INVENTORY_TABLE)
      .select(
        "order_id, quantity, total_cost, Inventory(ProductVariantCombination(image_url, Product(name, organization_id, ProductImage(image_url)), CombinationOption(VariantOption(name, VariantTypes(name)))))",
      )
      .returns<LineRow[]>(),
  ]); //returns everyhing in a row mapped down to variant types, variant images, variant option, product image, product name, and organization the belong to

  if (!org) return null;
  if (lineError) throw new Error(`Failed to load dashboard order items: ${lineError.message}`, { cause: lineError });

  const linesByOrder = new Map<string, LineRow[]>();
  for (const line of lineData ?? []) {
    if (line.Inventory?.ProductVariantCombination?.Product?.organization_id !== orgId) continue;
    const list = linesByOrder.get(line.order_id) ?? [];
    list.push(line);
    linesByOrder.set(line.order_id, list); //returns the orders that belong to the org in the session
  }

  const orderIds = [...linesByOrder.keys()];
  let orders: OrderRow[] = [];
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from(ORDER_TABLE)
      .select("order_id, status, placed_at, Student!Order_student_id_fkey(first_name, last_name), Payment(amount, made_at, PaymentMode(name))")
      .in("order_id", orderIds)
      .order("placed_at", { ascending: false })
      .returns<OrderRow[]>(); //this returns the orders ids mapped to to their logistical statuses (payments and all that)
    if (error) throw error;
    orders = data ?? [];
  }

  const orgTotal = (orderId: string) =>
    (linesByOrder.get(orderId) ?? []).reduce((sum, l) => sum + Number(l.total_cost), 0); //total number of orders

  const stats = {
    pendingPaymentVerification: orders.filter((o) => o.status === "Pending" && o.Payment.length > 0).length, //n=numberof pending orders
    pendingClaim: orders.filter((o) => o.status === "R4P").length, //number of ready for pick up orders
  };

  const current = manilaYearMonth(now);
  const completionByMonth: MonthlyCompletion[] = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const d = new Date(Date.UTC(current.year, current.month - 1 - i, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const inMonth = orders.filter((o) => {
      const ym = manilaYearMonth(new Date(o.placed_at));
      return ym.year === year && ym.month === month;
    });
    return {
      month: monthLabel(year, month),
      completed: inMonth.filter((o) => o.status === "Claimed").length,
      total: inMonth.length,
    };
  });

  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const salesByPeriod = { Weekly: 0, Monthly: 0, Yearly: 0 };
  for (const o of orders) {
    if (o.Payment.length === 0) continue;
    const total = orgTotal(o.order_id);
    const placed = new Date(o.placed_at);
    const ym = manilaYearMonth(placed);
    if (placed.getTime() >= weekAgo) salesByPeriod.Weekly += total;
    if (ym.year === current.year) {
      salesByPeriod.Yearly += total;
      if (ym.month === current.month) salesByPeriod.Monthly += total;
    }
  }

  const recentOrders: RecentOrder[] = orders.slice(0, RECENT_ORDERS).map((o) => {
    const lines = linesByOrder.get(o.order_id) ?? [];
    const name = [o.Student?.first_name, o.Student?.last_name].filter(Boolean).join(" ");
    return {
      orderId: o.order_id,
      placedAt: o.placed_at,
      customerName: name || "Customer",
      items: lines.map(lineLabel),
      images: lines.map(lineImage),
      paymentMode: o.Payment[0]?.PaymentMode?.name ?? null,
      status: o.status,
      total: orgTotal(o.order_id),
    };
  });

  return {
    orgName: org.acronym || org.name,
    stats,
    salesByPeriod,
    completionByMonth,
    recentOrders,
  };
}

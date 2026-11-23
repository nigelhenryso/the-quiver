import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ORDER_INVENTORY_TABLE,
  ORDER_TABLE,
  ORGANIZATION_TABLE,
} from "@/src/lib/supabase/tables";
import type { OrderStatus } from "@/src/types/enums";
import type { MonthlyCompletion, OrgDashboard, RecentOrder } from "@/src/types/Dashboard";

const TIME_ZONE = "Asia/Manila";
const MONTHS_SHOWN = 4; // months in the Completed card dropdown
const RECENT_ORDERS = 5;

// one OrderInventory row with its product info
type LineRow = {
  order_id: string;
  quantity: number;
  total_cost: number;
  Inventory: {
    ProductVariantCombination: {
      image_url: string | null;
      Product: { name: string; organization_id: string; ProductImage: { image_url: string }[] } | null;
      CombinationOption: {
        VariantOption: { name: string | null; image_url: string | null; VariantTypes: { name: string } | null } | null;
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

// year + month (1-12) of a date in Manila time
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

// capitalizes the first letter of each word, leaves the rest alone (so "ID" stays "ID")
const capitalize = (text: string) => text.trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

// "T - Shirt 3" -> "T-Shirt 3"
const productName = (name: string) => capitalize(name.replace(/(\w)\s+-\s+(\w)/g, "$1-$2"));

// "Type: Value", ex: "Color: Blue", "Design: 3" (just the value if it has no type)
function variantName(option: { name: string | null; VariantTypes: { name: string } | null }) {
  const name = option.name?.trim();
  if (!name) return null;
  const type = option.VariantTypes?.name?.trim();
  return type ? `${capitalize(type)}: ${capitalize(name)}` : capitalize(name);
}

function lineLabel(line: LineRow) {
  const combo = line.Inventory?.ProductVariantCombination;
  const name = productName(combo?.Product?.name ?? "Item");
  const variant = (combo?.CombinationOption ?? [])
    .map((o) => (o.VariantOption ? variantName(o.VariantOption) : null))
    .filter((v): v is string => Boolean(v))
    .sort() // stable order, ex: "Color: ..." before "Size: ..."
    .join(", ");
  return `${name}${variant ? ` - ${variant}` : ""} - ${line.quantity}x`;
}

// picture for one line: the combination's own image, else a variant option's image, else the product's first image
function lineImage(line: LineRow) {
  const combo = line.Inventory?.ProductVariantCombination;
  return (
    combo?.image_url ??
    combo?.CombinationOption.find((o) => o.VariantOption?.image_url)?.VariantOption?.image_url ??
    combo?.Product?.ProductImage[0]?.image_url ??
    null
  );
}

/**
 * Everything the org dashboard shows, for one organization.
 * RLS already limits OrderInventory to this org's items, and Order/Payment/Student to orders that contain them.
 *
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
        "order_id, quantity, total_cost, Inventory(ProductVariantCombination(image_url, Product(name, organization_id, ProductImage(image_url)), CombinationOption(VariantOption(name, image_url, VariantTypes(name)))))",
      )
      .returns<LineRow[]>(),
  ]);

  if (!org) return null;
  if (lineError) throw lineError;

  // keep only this org's lines (RLS should already do this) and group them by order
  const linesByOrder = new Map<string, LineRow[]>();
  for (const line of lineData ?? []) {
    if (line.Inventory?.ProductVariantCombination?.Product?.organization_id !== orgId) continue;
    const list = linesByOrder.get(line.order_id) ?? [];
    list.push(line);
    linesByOrder.set(line.order_id, list);
  }

  const orderIds = [...linesByOrder.keys()];
  let orders: OrderRow[] = [];
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from(ORDER_TABLE)
      .select("order_id, status, placed_at, Student!Order_student_id_fkey(first_name, last_name), Payment(amount, made_at, PaymentMode(name))")
      .in("order_id", orderIds)
      .order("placed_at", { ascending: false })
      .returns<OrderRow[]>();
    if (error) throw error;
    orders = data ?? [];
  }

  const orgTotal = (orderId: string) =>
    (linesByOrder.get(orderId) ?? []).reduce((sum, l) => sum + Number(l.total_cost), 0);

  // quick view counts
  const stats = {
    pendingPaymentVerification: orders.filter((o) => o.status === "Pending" && o.Payment.length > 0).length,
    pendingClaim: orders.filter((o) => o.status === "R4P").length,
  };

  // completion per month, newest first
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

  // sales = this org's item totals on paid orders, by when the order was placed
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

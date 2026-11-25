import type { SalesOrder, SalesRange } from "@/src/types/Sales";

const TIME_ZONE = "Asia/Manila";

/** Manila calendar date as "YYYY-MM-DD" (sortable as a string). */
export function manilaDateKey(date: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(date));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Term containing `todayKey`: Term 1 = Jan–Apr, Term 2 = May–Aug, Term 3 = Sep–Dec. */
export function termOf(todayKey: string): 1 | 2 | 3 {
  const month = Number(todayKey.slice(5, 7));
  return month <= 4 ? 1 : month <= 8 ? 2 : 3;
}

/** Inclusive "YYYY-MM-DD" bounds of the term containing `todayKey`. */
export function termBounds(todayKey: string) {
  const year = Number(todayKey.slice(0, 4));
  const startMonth = (termOf(todayKey) - 1) * 4 + 1; // 1, 5 or 9
  const endMonth = startMonth + 3;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  return { from: `${year}-${pad(startMonth)}-01`, to: `${year}-${pad(endMonth)}-${pad(lastDay)}` };
}

/** Inclusive "YYYY-MM-DD" bounds for a range; null bound = open. */
export function rangeBounds(
  range: SalesRange,
  now: Date,
  custom: { from: string; to: string } = { from: "", to: "" },
): { from: string | null; to: string | null } {
  const today = manilaDateKey(now);
  switch (range) {
    case "Today":
      return { from: today, to: today };
    case "This Month":
      return { from: `${today.slice(0, 7)}-01`, to: `${today.slice(0, 7)}-31` };
    case "This Term":
      return termBounds(today);
    case "This Year":
      return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` };
    case "All-Time":
      return { from: null, to: null };
    case "Custom Range": {
      let { from, to } = custom;
      if (from && to && from > to) [from, to] = [to, from];
      return { from: from || null, to: to || null };
    }
  }
}

export function filterByRange(orders: SalesOrder[], bounds: { from: string | null; to: string | null }) {
  return orders.filter((o) => {
    const key = manilaDateKey(o.placedAt);
    return (!bounds.from || key >= bounds.from) && (!bounds.to || key <= bounds.to);
  });
}

export type ProductSales = {
  productId: string;
  name: string;
  category: string;
  image: string | null;
  units: number;
  revenue: number;
};

export type CategorySales = { name: string; units: number; revenue: number; share: number };

/** Totals, best seller and per-category breakdown for the given (already filtered) orders. */
export function summarizeSales(orders: SalesOrder[]) {
  const products = new Map<string, ProductSales>();
  const categories = new Map<string, { units: number; revenue: number }>();
  let revenue = 0;
  let units = 0;

  for (const order of orders) {
    for (const line of order.lines) {
      revenue += line.total;
      units += line.quantity;

      const p = products.get(line.productId) ?? {
        productId: line.productId,
        name: line.productName,
        category: line.category,
        image: line.image,
        units: 0,
        revenue: 0,
      };
      p.units += line.quantity;
      p.revenue += line.total;
      products.set(line.productId, p);

      const c = categories.get(line.category) ?? { units: 0, revenue: 0 };
      c.units += line.quantity;
      c.revenue += line.total;
      categories.set(line.category, c);
    }
  }

  // best seller = most units, ties broken by revenue
  const bestSeller =
    [...products.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue)[0] ?? null;

  const byCategory: CategorySales[] = [...categories.entries()]
    .map(([name, c]) => ({ name, ...c, share: revenue > 0 ? c.revenue / revenue : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  return { revenue, units, bestSeller, byCategory };
}

export const shortOrderId = (orderId: string) => orderId.slice(-8).toUpperCase();

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function manilaDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

/** CSV of paid orders (any status), one row per item: product name and variant options get their own columns. */
export function paidOrdersCsv(orders: SalesOrder[]) {
  const header = [
    "Order Name", "Product Name", "Variant Options", "Quantity", "Item Total",
    "Order Price", "Customer Name", "Order Date and Time", "MOP",
  ];
  const rows = orders
    .filter((o) => o.paymentModes.length > 0)
    .flatMap((o) =>
      o.lines.map((l) => [
        `Order #${shortOrderId(o.orderId)}`,
        l.productName,
        l.variants.join(" / "),
        l.quantity,
        l.total.toFixed(2),
        o.total.toFixed(2),
        o.customerName,
        manilaDateTime(o.placedAt),
        o.paymentModes.join(" / "),
      ]),
    );
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

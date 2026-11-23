import { filterByRange, paidOrdersCsv, rangeBounds, summarizeSales, termBounds } from "@/src/lib/sales";
import type { SalesOrder } from "@/src/types/Sales";

const line = (productId: string, category: string, quantity: number, total: number) => ({
  productId, productName: productId, category, image: null, label: `${productId} - ${quantity}x`, quantity, total,
});

const orders: SalesOrder[] = [
  { orderId: "a-00000001", placedAt: "2026-11-02T16:30:00Z", status: "Claimed", customerName: "Yuan, Jr.", paymentModes: ["GCash"], lines: [line("shirt", "Shirt", 2, 400), line("pin", "Pin", 1, 20)], total: 420 },
  { orderId: "a-00000002", placedAt: "2026-11-20T02:00:00Z", status: "Pending", customerName: "TJ", paymentModes: ["Maya"], lines: [line("shirt", "Shirt", 5, 1000)], total: 1000 },
  { orderId: "a-00000003", placedAt: "2026-11-21T02:00:00Z", status: "R4P", customerName: "Antonio", paymentModes: [], lines: [line("pin", "Pin", 1, 20)], total: 20 },
  { orderId: "a-00000004", placedAt: "2026-08-10T02:00:00Z", status: "Claimed", customerName: "Antonio", paymentModes: ["Cash"], lines: [line("pin", "Pin", 3, 60)], total: 60 },
];

const now = new Date("2026-11-24T01:00:00Z");

test("ranges use Manila dates", () => {
  expect(rangeBounds("Today", now)).toEqual({ from: "2026-11-24", to: "2026-11-24" });
  expect(termBounds("2026-11-24")).toEqual({ from: "2026-09-01", to: "2026-12-31" });
  expect(termBounds("2027-02-01")).toEqual({ from: "2027-01-01", to: "2027-04-30" });
  expect(rangeBounds("Custom Range", now, { from: "2026-11-30", to: "2026-11-01" })).toEqual({ from: "2026-11-01", to: "2026-11-30" });
  // 2026-11-02T16:30Z is Nov 3 in Manila
  expect(filterByRange(orders, { from: "2026-11-03", to: "2026-11-03" }).map((o) => o.orderId)).toEqual(["a-00000001"]);
});

test("summary counts only what it is given (page passes Claimed)", () => {
  const claimed = filterByRange(orders, rangeBounds("This Month", now)).filter((o) => o.status === "Claimed");
  const s = summarizeSales(claimed);
  expect(s.revenue).toBe(420);
  expect(s.units).toBe(3);
  expect(s.bestSeller?.productId).toBe("shirt");
  expect(s.byCategory.map((c) => c.name)).toEqual(["Shirt", "Pin"]);
});

test("csv has paid orders only, escaped", () => {
  const rows = paidOrdersCsv(orders).split("\r\n");
  expect(rows[0]).toBe("Order Name,Order Price,Products,Customer Name,Order Date and Time,MOP");
  expect(rows).toHaveLength(4); // header + 3 paid
  expect(rows[1]).toBe('Order #00000001,420.00,shirt - 2x; pin - 1x,"Yuan, Jr.",2026-11-03 12:30 AM,GCash');
});

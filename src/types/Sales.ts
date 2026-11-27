import type { OrderStatus } from "./enums";

// shapes the org Sales page reads (built by salesService)

export type SalesLine = {
  productId: string;
  productName: string;
  category: string; // Product.Category name, "Uncategorized" if none
  image: string | null;
  variants: string[]; // variant name and size, ex: ["Blue", "L"]; empty for the default variant
  label: string; // ex: "T-Shirt 1 - Color: Blue - 2x"
  quantity: number;
  total: number; // price at sale × quantity
};

export type SalesOrder = {
  orderId: string;
  placedAt: string; // ISO timestamp
  status: OrderStatus | null;
  customerName: string;
  paymentModes: string[]; // empty = unpaid
  lines: SalesLine[]; // this org's lines only
  total: number; // this org's items only
};

export type OrgSales = {
  orgName: string;
  orders: SalesOrder[]; // newest first, every status (page filters to Claimed, CSV to paid)
};

export type SalesRange = "Today" | "This Month" | "This Term" | "This Year" | "All-Time" | "Custom Range";

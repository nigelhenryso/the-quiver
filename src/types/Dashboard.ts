import type { OrderStatus } from "./enums";

// shapes the org dashboard components read (built by orgDashboardService)

export type SalesPeriod = "Weekly" | "Monthly" | "Yearly";

export type DashboardStats = {
  pendingPaymentVerification: number; // Pending orders that already have a payment
  pendingClaim: number; // R4P orders
};

export type MonthlyCompletion = {
  month: string; // ex: "November 2026"
  completed: number; // Claimed orders placed that month
  total: number; // all orders placed that month
};

export type RecentOrder = {
  orderId: string;
  placedAt: string; // ISO timestamp
  customerName: string;
  items: string[]; // one per line, ex: "T - Shirt 3 - blue - 1x"
  images: (string | null)[]; // one per line, same order as items (null = no image)
  paymentMode: string | null; // null = not yet paid
  status: OrderStatus | null;
  total: number; // this org's items only
};

export type OrgDashboard = {
  orgName: string;
  stats: DashboardStats;
  salesByPeriod: Record<SalesPeriod, number>;
  completionByMonth: MonthlyCompletion[]; // newest first, first = this month
  recentOrders: RecentOrder[];
};

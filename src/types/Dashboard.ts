// view models for the org dashboard, built from Supabase rows in services/dashboardService.ts
import type { OrderStatus } from "./enums";

export type SalesPeriod = "Weekly" | "Monthly" | "Yearly";
export type SalesByPeriod = Record<SalesPeriod, number>;

export type DashboardStats = {
    /** Pending orders that already have a Digital payment to verify */
    pendingPaymentVerification: number;
    /** Orders with status R4P */
    pendingClaim: number;
    /** Orders placed this month with status Claimed */
    completedThisMonth: number;
    /** All orders placed this month */
    totalOrdersThisMonth: number;
};

export type RecentOrder = {
    orderId: string;
    placedAt: string;
    customerName: string | null; // null when RLS hides the Student row
    productName: string;
    variantLabel: string | null; // ex: "Size: M"
    quantity: number;
    paymentModeName: string | null; // null when no Payment row yet
    status: OrderStatus | null;
    total: number;
    imageUrl: string | null;
};

export type OrgDashboard = {
    orgName: string;
    stats: DashboardStats;
    salesByPeriod: SalesByPeriod;
    recentOrders: RecentOrder[];
};

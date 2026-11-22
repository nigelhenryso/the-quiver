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

/** One distinct inventory item (product + variant) inside an order */
export type RecentOrderItem = {
    inventoryId: string;
    productName: string;
    variantLabel: string | null; // ex: "Size: M"
    quantity: number; // OrderInventory rows for this inventory_id
    imageUrl: string | null;
};

export type RecentOrder = {
    orderId: string;
    placedAt: string;
    customerName: string | null; // null when RLS hides the Student row
    items: RecentOrderItem[];
    totalQuantity: number;
    paymentModeName: string | null; // null when no Payment row yet
    status: OrderStatus | null;
    total: number;
    /** 4 urls -> render as a 2x2 collage (4+ distinct items); otherwise 0 or 1 url */
    images: string[];
};

export type OrgDashboard = {
    orgName: string;
    stats: DashboardStats;
    salesByPeriod: SalesByPeriod;
    recentOrders: RecentOrder[];
};

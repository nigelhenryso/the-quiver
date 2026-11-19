import type { OrderStatus } from "./enums";

export type Order = {
    order_id: string;
    inventory_id: string;
    student_id: string;
    quantity: number;
    unit_price_sold: number;
    placed_at: string;
    status: OrderStatus | null;
}

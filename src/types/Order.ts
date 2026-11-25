import type { OrderStatus } from "./enums";

export type Order = {
    order_id: string;
    student_id: string;
    placed_at: string;
    status: OrderStatus | null;
}

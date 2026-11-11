export type Order ={
    order_id: string;
    inventory_id: string;
    student_id: string;
    quantity: number;
    unit_price_sold: number;
    is_fulfilled: boolean;
    placed_at: string;
}
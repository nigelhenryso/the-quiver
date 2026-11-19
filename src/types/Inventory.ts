export type Inventory = {
    inventory_id: string;
    product_id: string;
    created_at: string;
    updated_at: string;
    variant_id: string | null;
    stock_quantity: number | null;
}

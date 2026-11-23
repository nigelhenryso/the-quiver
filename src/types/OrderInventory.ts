// one line of an order: an inventory item with its quantity and price at time of sale
export type OrderInventory = {
    order_inventory_id: string;
    order_id: string;
    inventory_id: string;
    quantity: number;
    total_cost: number; // unit price at sale x quantity
}

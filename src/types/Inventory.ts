// stock for one ProductVariant (1:1)
export type Inventory = {
    inventory_id: string;
    variant_id: string;
    stock_quantity: number;
    sku: string | null;
    created_at: string;
    updated_at: string;
}

export type InventoryVariant = {
  id: string; // variant_id
  sku: string | null;
  options: { id: string; label: string }[];
  imageUrl: string | null;
  price: number;
  stock: number;
  sales: number;
};

export type InventoryProduct = {
  id: string;
  name: string;
  productId: string;
  categories: string[];
  imageUrl: string | null;
  price: number;
  stock: number;
  sales: number;
  isActive: boolean;
  variants: InventoryVariant[];
};

export type StockStatus = "in" | "out";

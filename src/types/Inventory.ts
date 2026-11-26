// stock for one ProductVariantCombination (1:1)
export type Inventory = {
    inventory_id: string;
    combination_id: string;
    stock_quantity: number;
    created_at: string;
    updated_at: string;
}

export type InventoryVariant = {
  id: string;
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

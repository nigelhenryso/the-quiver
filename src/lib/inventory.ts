import type { InventoryProduct, StockStatus } from "@/src/types/Inventory";

export const INVENTORY_PAGE_SIZE = 5;

export function getProductCategories(product: InventoryProduct): string[] {
  return product.categories.length ? product.categories : ["Uncategorized"];
}

export function getStockStatus(stock: number): StockStatus {
  return stock > 0 ? "in" : "out";
}

export const stockStatusLabel: Record<StockStatus, string> = {
  in: "In Stock",
  out: "Out of Stock",
};

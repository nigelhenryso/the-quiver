export type Variant = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  sales: number;
  salesL30D: number;
};

export type Product = {
  id: string;
  name: string;
  productId: string;
  categories: string[]; // Names of the product's linked database tags.
  imageUrl: string | null;
  price: number;
  stock: number; // total stock (includes variants)
  sales: number;
  salesL30D: number; // sales in the last 30 days
  isActive: boolean;
  variants: Variant[];
};

export function getProductCategories(product: Product): string[] {
  return product.categories.length ? product.categories : ["Uncategorized"];
}

export type StockStatus = "in" | "low" | "out";

// how many days of sales the stock should be able to cover
// NOTE: the Figma doesn't say what this number is, ask your team and change it here
export const DESIRED_STOCK_DAYS = 14;

// A.I.R. = Additional Inventory Required (see the tooltip on the Stock column)
// A.I.R. = average daily orders (L30D sales / 30) * desired days stock should last - stock
export function getAir(stock: number, salesL30D: number) {
  return (salesL30D / 30) * DESIRED_STOCK_DAYS - stock;
}

// out of stock = 0 units, low stock = A.I.R. is greater than 0, otherwise in stock
export function getStockStatus(stock: number, salesL30D: number): StockStatus {
  if (stock <= 0) return "out";
  if (getAir(stock, salesL30D) > 0) return "low";
  return "in";
}
export const stockStatusLabel: Record<StockStatus, string> = {
  in: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

// ex: 130 -> Php 130.00
export function formatPhp(amount: number) {
  return (
    "Php " +
    amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export const PAGE_SIZE = 5;

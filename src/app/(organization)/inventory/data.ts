export type Variant = {
  id: string;
  sku: string | null;
  options: { id: string; label: string }[];
  imageUrl: string | null;
  price: number;
  stock: number;
  sales: number;
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
  isActive: boolean;
  variants: Variant[];
};

export function getProductCategories(product: Product): string[] {
  return product.categories.length ? product.categories : ["Uncategorized"];
}

export type StockStatus = "in" | "out";

export function getStockStatus(stock: number): StockStatus {
  return stock > 0 ? "in" : "out";
}
export const stockStatusLabel: Record<StockStatus, string> = {
  in: "In Stock",
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

// dummy data for the org inventory page
// NOTE: replace getInventoryData() with real data (API / db) later

export type Category = "Shirt" | "ID Lace" | "Pins";
export const categories: Category[] = ["Shirt", "ID Lace", "Pins"];

export type Variant = {
  id: string;
  name: string; 
  price: number;
  stock: number;
  sales: number;
  salesL30D: number;
};

export type Product = {
  id: string;
  name: string;
  productId: string; // the SKU shown under the name
  category: Category;
  price: number;
  stock: number; // total stock (includes variants)
  sales: number;
  salesL30D: number; // sales in the last 30 days
  published: boolean;
  variants: Variant[];
};

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

// small helper so the list below stays readable
function product(
  n: number,
  name: string,
  category: Category,
  price: number,
  stock: number,
  sales: number,
  salesL30D: number,
  published: boolean,
  variants: Omit<Variant, "id">[] = [],
): Product {
  return {
    id: `p${n}`,
    name,
    productId: `QVR${String(1000 + n)}`,
    category,
    price,
    stock,
    sales,
    salesL30D,
    published,
    variants: variants.map((v, i) => ({ ...v, id: `p${n}-v${i + 1}` })),
  };
}

export function getInventoryData(): Product[] {
  return [
    // the first 5 match the Figma frames
    product(1, "Product Name", "Shirt", 130, 25, 50, 30, true, [
      { name: "White", price: 130, stock: 15, sales: 20, salesL30D: 10 },
    ]),
    product(2, "Product Name", "ID Lace", 230, 5, 120, 30, false),
    product(3, "Product Name", "Pins", 330, 0, 320, 80, true),
    product(4, "Product Name", "Shirt", 330, 0, 320, 80, true),
    product(5, "Product Name", "Shirt", 330, 0, 320, 80, true),

    product(6, "LSCS T-Shirt", "Shirt", 350, 6, 210, 44, true, [
      { name: "Small", price: 350, stock: 2, sales: 60, salesL30D: 10 },
      { name: "Medium", price: 350, stock: 4, sales: 90, salesL30D: 22 },
    ]),
    product(7, "ENGLICOM ID Lace", "ID Lace", 120, 0, 85, 12, false),
    product(8, "CSS Org Pin Set", "Pins", 90, 48, 140, 36, true),
    product(9, "Batch Shirt 2026", "Shirt", 420, 33, 64, 20, true, [
      { name: "Black", price: 420, stock: 18, sales: 40, salesL30D: 14 },
      { name: "Navy", price: 420, stock: 15, sales: 24, salesL30D: 6 },
    ]),
    product(10, "Lanyard + ID Holder", "ID Lace", 150, 62, 98, 25, true),
    product(11, "Mascot Pin", "Pins", 60, 120, 410, 90, true),
    product(12, "Anniversary Shirt", "Shirt", 380, 9, 175, 30, true),
    product(13, "Gold Logo Pin", "Pins", 75, 0, 52, 0, false),
    product(14, "Plain ID Lace", "ID Lace", 100, 71, 230, 58, true),
    product(15, "Hackathon Pin", "Pins", 65, 28, 77, 19, true),
    product(16, "Intramurals Shirt", "Shirt", 400, 14, 301, 61, true),
    product(17, "Rainbow ID Lace", "ID Lace", 130, 10, 44, 9, true),
    product(18, "Enamel Pin Pack", "Pins", 180, 40, 66, 11, true),
    product(19, "Alumni Shirt", "Shirt", 450, 0, 12, 0, false),
    product(20, "Name Tag Lace", "ID Lace", 110, 55, 150, 32, true),
  ];
}
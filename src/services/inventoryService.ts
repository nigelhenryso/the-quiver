import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, Variant } from "@/src/app/(organization)/inventory/data";
import { INVENTORY_TABLE, ORDER_INVENTORY_TABLE, PRODUCT_TABLE } from "@/src/lib/supabase/tables";
import type { Inventory } from "@/src/types/Inventory";
import type { Order } from "@/src/types/Order";
import type { Product as ProductRow } from "@/src/types/Product";
import type { VariantOption } from "@/src/types/VariantOption";

type CatalogRow = Pick<ProductRow, "product_id" | "name" | "price" | "is_active"> & {
  ProductTag: { Tag: { name: string } | null }[];
  ProductVariant: { variant_id: string; VariantOption: Pick<VariantOption, "name" | "image_url"> | null }[];
  ProductImage: { image_url: string }[];
};

type StockRow = Pick<Inventory, "inventory_id" | "product_id" | "variant_id" | "stock_quantity">;
type SalesRow = Pick<Inventory, "inventory_id"> & { Order: Pick<Order, "placed_at"> };

const QUERY_PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;

async function readAll<T>(
  resource: string,
  query: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
    const { data, error } = await query(offset, offset + QUERY_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to load ${resource}: ${error.message}`);
    if (!data?.length) return rows;
    rows.push(...data);
    if (data.length < QUERY_PAGE_SIZE) return rows;
  }
}

export async function getOrgInventory(
  supabase: SupabaseClient,
  organizationId: string,
  now = new Date(),
): Promise<Product[]> {
  const catalog = await readAll<CatalogRow>("products", (from, to) =>
    supabase
      .from(PRODUCT_TABLE)
      .select(`
        product_id, name, price, is_active,
        ProductTag (Tag (name)),
        ProductVariant (variant_id, VariantOption (name, image_url)),
        ProductImage (image_url)
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .order("product_id")
      .order("product_image_id", { referencedTable: "ProductImage" })
      .limit(1, { referencedTable: "ProductImage" })
      .range(from, to)
      .overrideTypes<CatalogRow[], { merge: false }>(),
  );

  const products = new Map<string, Product>();
  const variantsByProduct = new Map<string, Map<string, Variant>>();
  for (const row of catalog) {
    const price = Number(row.price);
    const variants = row.ProductVariant.map(({ variant_id, VariantOption: option }) => ({
      id: variant_id,
      name: option?.name?.trim() || "Unnamed variant",
      imageUrl: option?.image_url ?? null,
      price,
      stock: 0,
      sales: 0,
      salesL30D: 0,
    })).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    variantsByProduct.set(row.product_id, new Map(variants.map((variant) => [variant.id, variant])));
    products.set(row.product_id, {
      id: row.product_id,
      productId: row.product_id,
      name: row.name,
      categories: [...new Set(row.ProductTag.flatMap(({ Tag: tag }) => tag?.name ? [tag.name] : []))].sort(),
      imageUrl: row.ProductImage[0]?.image_url ?? null,
      price,
      stock: 0,
      sales: 0,
      salesL30D: 0,
      isActive: row.is_active,
      variants,
    });
  }

  const productIds = [...products.keys()];
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  for (let offset = 0; offset < productIds.length; offset += ID_BATCH_SIZE) {
    const inventory = await readAll<StockRow>("stock", (from, to) =>
      supabase
        .from(INVENTORY_TABLE)
        .select("inventory_id, product_id, variant_id, stock_quantity")
        .in("product_id", productIds.slice(offset, offset + ID_BATCH_SIZE))
        .order("inventory_id")
        .range(from, to),
    );
    const inventoryById = new Map(inventory.map((row) => [row.inventory_id, row]));
    for (const row of inventory) {
      const stock = row.stock_quantity ?? 0;
      products.get(row.product_id)!.stock += stock;
      const variant = row.variant_id ? variantsByProduct.get(row.product_id)?.get(row.variant_id) : undefined;
      if (variant) variant.stock += stock;
    }

    const inventoryIds = [...inventoryById.keys()];
    for (let start = 0; start < inventoryIds.length; start += ID_BATCH_SIZE) {
      const soldUnits = await readAll<SalesRow>("sales", (from, to) =>
        supabase
          .from(ORDER_INVENTORY_TABLE)
          .select("inventory_id, Order!inner (placed_at)")
          .in("inventory_id", inventoryIds.slice(start, start + ID_BATCH_SIZE))
          .eq("Order.status", "Claimed")
          .lte("Order.placed_at", now.toISOString())
          .order("order_inventory_id")
          .range(from, to)
          .overrideTypes<SalesRow[], { merge: false }>(),
      );
      for (const unit of soldUnits) {
        const row = inventoryById.get(unit.inventory_id)!;
        const product = products.get(row.product_id)!;
        const variant = row.variant_id ? variantsByProduct.get(row.product_id)?.get(row.variant_id) : undefined;
        const recentQuantity = Date.parse(unit.Order.placed_at) >= cutoff ? 1 : 0;
        product.sales += 1;
        product.salesL30D += recentQuantity;
        if (variant) {
          variant.sales += 1;
          variant.salesL30D += recentQuantity;
        }
      }
    }
  }
  return [...products.values()];
}

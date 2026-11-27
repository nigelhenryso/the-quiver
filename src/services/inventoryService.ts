import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryProduct, InventoryVariant } from "@/src/types/Inventory";
import { ORDER_INVENTORY_TABLE, PRODUCT_TABLE, PRODUCT_VARIANT_TABLE } from "@/src/lib/supabase/tables";
import type { Order } from "@/src/types/Order";
import type { Product as ProductRow } from "@/src/types/Product";
import { DEFAULT_VARIANT_NAME, type ProductVariant } from "@/src/types/ProductVariant";
import { resolveProductMedia } from "./productMedia";

type CatalogRow = Pick<ProductRow, "product_id" | "name" | "price" | "is_active"> & {
  Category: { name: string } | null;
  ProductImage: { image_url: string | null }[];
};

type VariantRow = Pick<ProductVariant, "variant_id" | "product_id" | "name" | "size" | "price_override" | "image_url"> & {
  Inventory: { inventory_id: string; stock_quantity: number | null; sku: string | null } | null;
};

type SalesRow = { inventory_id: string; quantity: number; Order: Pick<Order, "placed_at"> };

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

/** "Variant: Blue" / "Size: M" chips for one variant; empty for the default variant. */
function variantOptions(variant: VariantRow) {
  const options: { id: string; label: string }[] = [];
  const name = variant.name.trim();
  if (name && name !== DEFAULT_VARIANT_NAME) options.push({ id: `${variant.variant_id}:name`, label: `Variant: ${name}` });
  if (variant.size) options.push({ id: `${variant.variant_id}:size`, label: `Size: ${variant.size}` });
  return options;
}

export async function getOrgInventory(
  supabase: SupabaseClient,
  organizationId: string,
  now = new Date(),
): Promise<InventoryProduct[]> {
  const catalog = await readAll<CatalogRow>("products", (from, to) =>
    supabase
      .from(PRODUCT_TABLE)
      .select(`
        product_id, name, price, is_active,
        Category (name),
        ProductImage (image_url)
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .order("product_id")
      .order("position", { referencedTable: "ProductImage", nullsFirst: false })
      .order("product_image_id", { referencedTable: "ProductImage" })
      .limit(1, { referencedTable: "ProductImage" })
      .range(from, to)
      .overrideTypes<CatalogRow[], { merge: false }>(),
  );

  const products = new Map(catalog.map((row): [string, InventoryProduct] => [
    row.product_id,
    {
      id: row.product_id,
      productId: row.product_id,
      name: row.name,
      categories: row.Category?.name ? [row.Category.name] : [],
      imageUrl: row.ProductImage[0]?.image_url ?? null,
      price: Number(row.price),
      stock: 0,
      sales: 0,
      isActive: row.is_active,
      variants: [],
    },
  ]));

  const productIds = [...products.keys()];
  const inventoryById = new Map<string, { product: InventoryProduct; variant?: InventoryVariant }>();
  const variantsByProduct = new Map<string, VariantRow[]>();
  for (let offset = 0; offset < productIds.length; offset += ID_BATCH_SIZE) {
    const variants = await readAll<VariantRow>("product variants", (from, to) =>
      supabase
        .from(PRODUCT_VARIANT_TABLE)
        .select("variant_id, product_id, name, size, price_override, image_url, Inventory (inventory_id, stock_quantity, sku)")
        .in("product_id", productIds.slice(offset, offset + ID_BATCH_SIZE))
        .order("variant_id")
        .range(from, to)
        .overrideTypes<VariantRow[], { merge: false }>(),
    );
    for (const variant of variants) {
      const siblings = variantsByProduct.get(variant.product_id);
      if (siblings) siblings.push(variant);
      else variantsByProduct.set(variant.product_id, [variant]);
    }
  }

  for (const [productId, variants] of variantsByProduct) {
    const product = products.get(productId)!;
    for (const row of variants) {
      const stock = row.Inventory?.stock_quantity ?? 0;
      const price = Number(row.price_override ?? product.price);
      const options = variantOptions(row);

      product.stock += stock;
      let variant: InventoryVariant | undefined;
      if (options.length) {
        variant = {
          id: row.variant_id,
          sku: row.Inventory?.sku ?? null,
          options,
          imageUrl: row.image_url,
          price,
          stock,
          sales: 0,
        };
        product.variants.push(variant);
      } else {
        product.imageUrl ??= row.image_url;
        if (variants.length === 1) product.price = price;
      }
      if (row.Inventory) {
        inventoryById.set(row.Inventory.inventory_id, { product, variant });
      }
    }
    product.variants.sort((a, b) =>
      a.options.map(({ label }) => label).join(" ").localeCompare(b.options.map(({ label }) => label).join(" "))
      || a.id.localeCompare(b.id),
    );
    product.imageUrl ??= product.variants.find((variant) => variant.imageUrl)?.imageUrl ?? null;
  }

  const inventoryIds = [...inventoryById.keys()];
  const asOf = now.toISOString();
  for (let start = 0; start < inventoryIds.length; start += ID_BATCH_SIZE) {
    const sales = await readAll<SalesRow>("sales", (from, to) =>
      supabase
        .from(ORDER_INVENTORY_TABLE)
        .select("inventory_id, quantity, Order!inner (placed_at)")
        .in("inventory_id", inventoryIds.slice(start, start + ID_BATCH_SIZE))
        .eq("Order.status", "Claimed")
        .lte("Order.placed_at", asOf)
        .order("order_inventory_id")
        .range(from, to)
        .overrideTypes<SalesRow[], { merge: false }>(),
    );
    for (const line of sales) {
      const { product, variant } = inventoryById.get(line.inventory_id)!;
      product.sales += line.quantity;
      if (variant) variant.sales += line.quantity;
    }
  }

  const rows = [...products.values()];
  const resolveImage = await resolveProductMedia(supabase, rows.flatMap((product) =>
    [product.imageUrl, ...product.variants.map((variant) => variant.imageUrl)],
  ));
  for (const product of rows) {
    product.imageUrl = resolveImage(product.imageUrl);
    for (const variant of product.variants) variant.imageUrl = resolveImage(variant.imageUrl);
  }
  return rows;
}

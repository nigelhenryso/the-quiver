import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, Variant } from "@/src/app/(organization)/inventory/data";
import { ORDER_INVENTORY_TABLE, PRODUCT_TABLE, PRODUCT_VARIANT_COMBINATION_TABLE } from "@/src/lib/supabase/tables";
import type { Order } from "@/src/types/Order";
import type { Product as ProductRow } from "@/src/types/Product";
import type { VariantOption } from "@/src/types/VariantOption";
import { resolveProductMedia } from "./productMedia";

type CatalogRow = Pick<ProductRow, "product_id" | "name" | "price" | "is_active"> & {
  ProductTag: { Tag: { name: string } | null }[];
  ProductImage: { image_url: string | null }[];
};

type CombinationRow = {
  combination_id: string;
  product_id: string;
  sku: string | null;
  price_override: number | null;
  image_url: string | null;
  CombinationOption: {
    variant_id: string;
    VariantOption: (Pick<VariantOption, "name"> & { VariantTypes: { name: string } | null }) | null;
  }[];
  Inventory: { inventory_id: string; stock_quantity: number | null } | null;
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

  const products = new Map(catalog.map((row): [string, Product] => [
    row.product_id,
    {
      id: row.product_id,
      productId: row.product_id,
      name: row.name,
      categories: [...new Set(row.ProductTag.flatMap(({ Tag: tag }) => tag?.name ? [tag.name] : []))].sort(),
      imageUrl: row.ProductImage[0]?.image_url ?? null,
      price: Number(row.price),
      stock: 0,
      sales: 0,
      isActive: row.is_active,
      variants: [],
    },
  ]));

  const productIds = [...products.keys()];
  const inventoryById = new Map<string, { product: Product; variant?: Variant }>();
  const combinationsByProduct = new Map<string, CombinationRow[]>();
  for (let offset = 0; offset < productIds.length; offset += ID_BATCH_SIZE) {
    const combinations = await readAll<CombinationRow>("variant combinations", (from, to) =>
      supabase
        .from(PRODUCT_VARIANT_COMBINATION_TABLE)
        .select(`
          combination_id, product_id, sku, price_override, image_url,
          CombinationOption (variant_id, VariantOption (name, VariantTypes (name))),
          Inventory (inventory_id, stock_quantity)
        `)
        .in("product_id", productIds.slice(offset, offset + ID_BATCH_SIZE))
        .order("combination_id")
        .range(from, to)
        .overrideTypes<CombinationRow[], { merge: false }>(),
    );
    for (const combination of combinations) {
      const siblings = combinationsByProduct.get(combination.product_id);
      if (siblings) siblings.push(combination);
      else combinationsByProduct.set(combination.product_id, [combination]);
    }
  }

  for (const [productId, combinations] of combinationsByProduct) {
    const product = products.get(productId)!;
    for (const combination of combinations) {
      const stock = combination.Inventory?.stock_quantity ?? 0;
      const price = Number(combination.price_override ?? product.price);
      const options = combination.CombinationOption.map(({ variant_id, VariantOption: option }) => {
        const name = option?.name?.trim() || "Unnamed option";
        const type = option?.VariantTypes?.name?.trim();
        return { id: variant_id, label: type ? `${type}: ${name}` : name };
      }).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));

      product.stock += stock;
      let variant: Variant | undefined;
      if (options.length) {
        variant = {
          id: combination.combination_id,
          sku: combination.sku,
          options,
          imageUrl: combination.image_url,
          price,
          stock,
          sales: 0,
        };
        product.variants.push(variant);
      } else {
        product.imageUrl ??= combination.image_url;
        if (combinations.length === 1) product.price = price;
      }
      if (combination.Inventory) {
        inventoryById.set(combination.Inventory.inventory_id, { product, variant });
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

import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_TABLE } from "@/src/lib/supabase/tables";
import type { ProductSize } from "@/src/types/enums";
import type { Product } from "@/src/types/Product";
import { DEFAULT_VARIANT_NAME, type ProductVariant } from "@/src/types/ProductVariant";
import type { EditIdentity, ExistingCombination, SavedMedia, VariantFields } from "./createProduct";
import { resolveProductMedia } from "./productMedia";

export type EditableProduct = Product & {
  identity: EditIdentity;
  images: SavedMedia[];
  video: SavedMedia | null;
  sizes: string[];
  variants: (Omit<VariantFields, "image" | "stock"> & { stock: Record<string, string> })[];
};

type Row = Product & {
  ProductImage: { image_url: string; position: number | null; product_image_id: string }[];
  ProductVariant: (Pick<ProductVariant, "variant_id" | "name" | "size" | "price_override" | "image_url"> & {
    Inventory: { stock_quantity: number } | null;
  })[];
};

// The variant dialog stores sizes by these values (see VariantConfigurationDialog).
const FREE_SIZE = "Free Size/One Size";
const SIZE_FORM_VALUES: Partial<Record<ProductSize, string>> = {
  S: "Small", M: "Medium", L: "Large", XL: "Extra Large", "2XL": "Extra Extra Large",
};
const formSize = (size: ProductSize | null) => size ? SIZE_FORM_VALUES[size] ?? size : FREE_SIZE;

export async function getEditableProduct(supabase: SupabaseClient, productId: string, organizationId: string): Promise<EditableProduct | null> {
  const { data, error } = await supabase.from(PRODUCT_TABLE).select(`
    *,
    ProductImage(image_url, position, product_image_id),
    ProductVariant(variant_id, name, size, price_override, image_url, Inventory(stock_quantity))
  `).eq("product_id", productId).eq("organization_id", organizationId).maybeSingle<Row>();
  if (error) throw error;
  if (!data) return null;

  const { ProductImage: images, ProductVariant: variants, ...product } = data;
  const resolve = await resolveProductMedia(supabase, [
    ...images.map(({ image_url }) => image_url),
    ...variants.map(({ image_url }) => image_url),
    product.cover_video_path,
  ]);
  const media = (reference: string): SavedMedia => ({ reference, url: resolve(reference) });
  const identity: EditIdentity = { id: product.product_id, version: product.updated_at, basePrice: Number(product.price) };
  const rows = new Map<string, EditableProduct["variants"][number]>();
  const sizes = new Set<string>();

  const sorted = [...variants].sort((a, b) => a.variant_id.localeCompare(b.variant_id));
  for (const variant of sorted) {
    const existing: ExistingCombination = {
      id: variant.variant_id,
      stock: variant.Inventory?.stock_quantity ?? 0,
      price: variant.price_override === null ? null : Number(variant.price_override),
      image: variant.image_url,
    };
    const isDefault = variant.name.trim() === DEFAULT_VARIANT_NAME;
    if (variants.length === 1 && isDefault && !variant.size) {
      identity.base = existing;
      continue;
    }
    const color = isDefault ? "" : variant.name;
    const size = formSize(variant.size);
    const price = String(existing.price ?? product.price);
    // One form row per (color, price, image); its sizes become the stock columns.
    const key = JSON.stringify([color.toLowerCase(), price, variant.image_url]);
    let row = rows.get(key);
    if (!row || row.sizes?.includes(size)) {
      row = { rowId: variant.variant_id, color, price, sizes: [], stock: {}, existing: {},
        savedImage: variant.image_url ? media(variant.image_url) : null };
      rows.set(rows.has(key) ? variant.variant_id : key, row);
    }
    row.sizes!.push(size);
    row.stock = { ...row.stock, [size.toLowerCase()]: String(existing.stock) };
    row.existing = { ...row.existing, [size.toLowerCase()]: existing };
    sizes.add(size);
  }

  return {
    ...product,
    identity,
    images: images.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)
      || a.product_image_id.localeCompare(b.product_image_id)).map(({ image_url }) => media(image_url)),
    video: product.cover_video_path ? media(product.cover_video_path) : null,
    sizes: [...sizes],
    variants: [...rows.values()],
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_TABLE } from "@/src/lib/supabase/tables";
import type { Product } from "@/src/types/Product";
import type { EditIdentity, ExistingCombination, SavedMedia, VariantFields } from "./createProduct";
import { resolveProductMedia } from "./productMedia";

export type EditableProduct = Product & {
  tagId: string;
  identity: EditIdentity;
  images: SavedMedia[];
  video: SavedMedia | null;
  sizes: string[];
  variants: (Omit<VariantFields, "image" | "stock"> & { stock: Record<string, string> })[];
};

type Row = Product & {
  ProductTag: { tag_id: string }[];
  ProductImage: { image_url: string; position: number | null; product_image_id: string }[];
  ProductVariantCombination: {
    combination_id: string;
    price_override: number | null;
    image_url: string | null;
    Inventory: { stock_quantity: number } | null;
    CombinationOption: { VariantOption: { name: string | null; VariantTypes: { name: string } | null } | null }[];
  }[];
};

export async function getEditableProduct(supabase: SupabaseClient, productId: string, organizationId: string): Promise<EditableProduct | null> {
  const { data, error } = await supabase.from(PRODUCT_TABLE).select(`
    *,
    ProductTag(tag_id),
    ProductImage(image_url, position, product_image_id),
    ProductVariantCombination(combination_id, price_override, image_url, Inventory(stock_quantity),
      CombinationOption(VariantOption(name, VariantTypes(name))))
  `).eq("product_id", productId).eq("organization_id", organizationId).maybeSingle<Row>();
  if (error) throw error;
  if (!data) return null;

  const { ProductTag: tags, ProductImage: images, ProductVariantCombination: combinations, ...product } = data;
  const resolve = await resolveProductMedia(supabase, [
    ...images.map(({ image_url }) => image_url),
    ...combinations.map(({ image_url }) => image_url),
    product.cover_video_path,
  ]);
  const media = (reference: string): SavedMedia => ({ reference, url: resolve(reference) });
  const identity: EditIdentity = { id: product.product_id, version: product.updated_at, basePrice: Number(product.price) };
  const rows = new Map<string, EditableProduct["variants"][number]>();
  const sizes = new Set<string>();

  for (const combination of combinations) {
    const options = combination.CombinationOption.flatMap(({ VariantOption: option }) =>
      option?.name ? [{ name: option.name, type: option.VariantTypes?.name }] : []);
    const existing: ExistingCombination = {
      id: combination.combination_id,
      stock: combination.Inventory?.stock_quantity ?? 0,
      price: combination.price_override === null ? null : Number(combination.price_override),
      image: combination.image_url,
    };
    if (combinations.length === 1 && !options.length) {
      identity.base = existing;
      continue;
    }
    const color = options.find((option) => option.type === "Color")?.name ?? "";
    const size = options.find((option) => option.type === "Size")?.name ?? "";
    const label = options.filter((option) => option.type !== "Color" && option.type !== "Size")
      .map((option) => option.type ? `${option.type}: ${option.name}` : option.name).join(", ");
    const price = String(existing.price ?? product.price);
    const key = label ? combination.combination_id : JSON.stringify([color, price, combination.image_url]);
    let row = rows.get(key);
    if (!row || row.sizes?.includes(size)) {
      row = { rowId: combination.combination_id, color, label: label || undefined, price, sizes: [], stock: {},
        existing: {}, savedImage: combination.image_url ? media(combination.image_url) : null };
      rows.set(rows.has(key) ? combination.combination_id : key, row);
    }
    row.sizes!.push(size);
    row.stock = { ...row.stock, [size.toLowerCase()]: String(existing.stock) };
    row.existing = { ...row.existing, [size.toLowerCase()]: existing };
    if (size) sizes.add(size);
  }

  return {
    ...product,
    tagId: tags.map(({ tag_id }) => tag_id).sort()[0] ?? "",
    identity,
    images: images.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)
      || a.product_image_id.localeCompare(b.product_image_id)).map(({ image_url }) => media(image_url)),
    video: product.cover_video_path ? media(product.cover_video_path) : null,
    sizes: [...sizes],
    variants: [...rows.values()],
  };
}

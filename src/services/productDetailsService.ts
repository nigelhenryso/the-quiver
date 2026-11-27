import type { SupabaseClient } from "@supabase/supabase-js";
import { ORDER_CART_ITEM_TABLE, ORDER_CART_TABLE } from "@/src/lib/supabase/tables";
import type { ProductSize } from "@/src/types/enums";
import type { ProductDetails, ProductMedia, ProductOptionGroup } from "@/src/types/ProductDetails";
import { DEFAULT_VARIANT_NAME } from "@/src/types/ProductVariant";
import { resolveProductMedia } from "./productMedia";

/** Row returned by the get_student_product_details RPC (supabase/erd_v2/03_rpcs.sql). */
type ProductDetailsRow = {
  product_id: string;
  name: string;
  price: number | string;
  description: string | null;
  category: string | null;
  cover_video_path: string | null;
  is_preorder: boolean;
  organization: { organization_id: string; name: string; acronym: string | null };
  images: string[];
  variants: {
    variant_id: string;
    inventory_id: string | null;
    name: string;
    size: ProductSize | null;
    price: number | string;
    image_url: string | null;
    stock: number;
  }[];
  reviews: {
    rating_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer: string | null;
    avatar_url: string | null;
    variants: string[];
    images: string[];
  }[];
};

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL", "6XL"];

/** "blue" → "Blue", "navy blue" → "Navy Blue", "xl" → "XL". Leaves the rest of each word as typed. */
export function formatVariantName(name: string) {
  const trimmed = name.trim();
  if (SIZE_ORDER.includes(trimmed.toUpperCase())) return trimmed.toUpperCase();
  return trimmed.replace(/(^|[\s\-/(])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase());
}

function optionSort(a: { name: string }, b: { name: string }) {
  const sizeA = SIZE_ORDER.indexOf(a.name.toUpperCase());
  const sizeB = SIZE_ORDER.indexOf(b.name.toUpperCase());
  if (sizeA !== -1 && sizeB !== -1) return sizeA - sizeB;
  if (sizeA !== -1) return -1;
  if (sizeB !== -1) return 1;
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

const nameOptionId = (name: string) => `name:${name.trim().toLowerCase()}`;
const sizeOptionId = (size: string) => `size:${size}`;

/** Each variant is (name, size); the picker shows a Size group and a Variant group, each only when it has choices. */
function groupOptions(variants: ProductDetailsRow["variants"]): ProductOptionGroup[] {
  const sizes = new Map<string, string>();
  const names = new Map<string, string>();
  for (const variant of variants) {
    if (variant.size) sizes.set(sizeOptionId(variant.size), variant.size);
    if (variant.name.trim() !== DEFAULT_VARIANT_NAME) names.set(nameOptionId(variant.name), formatVariantName(variant.name));
  }
  const toGroup = (key: string, name: string, options: Map<string, string>): ProductOptionGroup[] => options.size
    ? [{ key, name, options: [...options].map(([id, label]) => ({ id, name: label })).sort(optionSort) }]
    : [];
  return [...toGroup("size", "Size", sizes), ...toGroup("variant", "Variant", names)];
}

function optionIds(variant: ProductDetailsRow["variants"][number]) {
  return [
    ...(variant.size ? [sizeOptionId(variant.size)] : []),
    ...(variant.name.trim() !== DEFAULT_VARIANT_NAME ? [nameOptionId(variant.name)] : []),
  ];
}

/** Everything the product details page shows, or null if the student can't see the product. */
export async function getProductDetails(supabase: SupabaseClient, productId: string): Promise<ProductDetails | null> {
  const { data, error } = await supabase.rpc("get_student_product_details", { p_product_id: productId });
  if (error) {
    // invalid uuid → treat as not found
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load product: ${error.message}`, { cause: error });
  }
  const row = data as ProductDetailsRow | null;
  if (!row) return null;

  const resolve = await resolveProductMedia(supabase, [
    ...row.images,
    row.cover_video_path,
    ...row.variants.map((variant) => variant.image_url),
    ...row.reviews.flatMap((review) => [review.avatar_url, ...review.images]),
  ]);

  const images = row.images.flatMap((reference) => {
    const url = resolve(reference);
    return url ? [{ kind: "image" as const, url }] : [];
  });
  const videoUrl = resolve(row.cover_video_path);
  const media: ProductMedia[] = [...images];
  // Video sits right after the cover photo.
  if (videoUrl) media.splice(Math.min(1, media.length), 0, { kind: "video", url: videoUrl });

  const reviews = row.reviews.map((review) => ({
    id: review.rating_id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
    reviewer: review.reviewer ?? "Student",
    avatarUrl: resolve(review.avatar_url),
    variants: review.variants.map((label) => label.split(" / ").map(formatVariantName).join(" / ")),
    imageUrls: review.images.flatMap((reference) => resolve(reference) ?? []),
  }));

  return {
    id: row.product_id,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    isPreOrder: row.is_preorder,
    organization: {
      id: row.organization.organization_id,
      name: row.organization.name,
      acronym: row.organization.acronym,
    },
    media,
    optionGroups: groupOptions(row.variants),
    combinations: row.variants.map((variant) => ({
      id: variant.variant_id,
      inventoryId: variant.inventory_id,
      price: Number(variant.price),
      stock: variant.stock,
      optionIds: optionIds(variant),
      imageUrl: resolve(variant.image_url),
    })),
    reviews,
    averageRating: reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null,
  };
}

/** Number of units in the student's cart for one organization. */
export async function getOrgCartCount(supabase: SupabaseClient, studentId: string, organizationId: string) {
  const { data, error } = await supabase
    .from(ORDER_CART_TABLE)
    .select(`${ORDER_CART_ITEM_TABLE} (quantity)`)
    .eq("student_id", studentId)
    .eq("organization_id", organizationId)
    .maybeSingle<{ OrderCartItem: { quantity: number }[] }>();
  if (error) {
    console.error("Could not load cart count", error);
    return 0;
  }
  return data?.OrderCartItem.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

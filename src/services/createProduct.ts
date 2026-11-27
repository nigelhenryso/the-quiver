import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_MEDIA_BUCKET, PRODUCT_MEDIA_LIMIT } from "./productMedia";

export type VariantFields = {
  color: string;
  price: string;
  image: File | null;
  stock: Map<string, string>;
  rowId?: string;
  label?: string;
  sizes?: string[];
  savedImage?: SavedMedia | null;
  existing?: Record<string, ExistingCombination>;
};

export type SavedMedia = { reference: string; url: string | null };
/** An existing ProductVariant row (id = variant_id). */
export type ExistingCombination = { id: string; stock: number; price: number | null; image: string | null };
export type EditIdentity = { id: string; version: string; basePrice: number; base?: ExistingCombination };

type Combination = {
  color: string | null;
  size: string | null;
  stock: number;
  price: number | null;
  image_path: string | null;
  variant_id?: string;
  previous_stock?: number;
};

export type ProductSaveDraft = {
  name: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  images: (File | SavedMedia)[];
  video: File | SavedMedia | null;
  published: boolean;
  variants: VariantFields[];
  sizes: string[];
  form: FormData;
  edit?: EditIdentity;
};

export type PreparedProduct = {
  product_id: string;
  name: string;
  description: string;
  category_id: string | null;
  category_name: string | null;
  is_active: boolean;
  is_for_members_only: boolean;
  price: number;
  images: string[];
  video_path: string | null;
  pickup_contact_person: string;
  pickup_contact_email: string;
  pickup_contact_number: string;
  pickup_social_url: string | null;
  preorder_start_date: string | null;
  preorder_end_date: string | null;
  combinations: Combination[];
  edit_id?: string;
  expected_updated_at?: string;
};

export type PreparedProductSave = { listing: PreparedProduct; uploads: string[] };

export async function removeProductUploads(supabase: SupabaseClient, paths: string[]) {
  if (!paths.length) return;
  try {
    const { error } = await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove(paths);
    if (error) console.error("Could not clean up product uploads", error);
  } catch (error) {
    console.error("Could not clean up product uploads", error);
  }
}

export async function prepareProduct(supabase: SupabaseClient, draft: ProductSaveDraft): Promise<PreparedProductSave> {
  const files = [...draft.images, draft.video, ...draft.variants.map((variant) => variant.image)];
  if (files.some((file) => file instanceof File && file.size > PRODUCT_MEDIA_LIMIT)) {
    throw new Error("Each photo or video must be 30 MB or smaller.");
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sign in to your organization account before saving.");

  const productId = draft.edit?.id ?? crypto.randomUUID();
  const uploadPrefix = `${user.id}/${productId}`;
  const paths: string[] = [];
  async function upload(file: File | SavedMedia) {
    if (!(file instanceof File)) return file.reference;
    const path = `${uploadPrefix}/${crypto.randomUUID()}`;
    paths.push(path);
    const { error } = await supabase.storage.from(PRODUCT_MEDIA_BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw new Error(`Couldn’t upload ${file.name}. Please try again.`, { cause: error });
    return draft.edit ? `${PRODUCT_MEDIA_BUCKET}/${path}` : path;
  }

  const value = (name: string) => String(draft.form.get(name) ?? "").trim();
  const preorder = draft.form.has("pre-order");
  const sizes = draft.sizes.length ? draft.sizes : [""];

  try {
    const images = [];
    for (const image of draft.images) images.push(await upload(image));
    const videoPath = draft.video ? await upload(draft.video) : null;
    const combinations: Combination[] = [];
    for (const variant of draft.variants) {
      const imagePath = variant.image ? await upload(variant.image) : variant.savedImage?.reference ?? null;
      for (const size of variant.sizes ?? sizes) {
        const sizeKey = size.toLowerCase();
        const existing = variant.existing && Object.hasOwn(variant.existing, sizeKey) ? variant.existing[sizeKey] : undefined;
        const price = Number(variant.price);
        combinations.push({
          color: variant.color || null,
          size: size || null,
          stock: Number(variant.stock.get(sizeKey)),
          price: existing && price === Number(existing.price ?? draft.edit?.basePrice) ? existing.price : price,
          image_path: imagePath,
          ...(existing && { variant_id: existing.id, previous_stock: existing.stock }),
        });
      }
    }
    const inputPrice = Number(value("product-price"));
    const base = draft.edit?.base;
    const price = combinations.length
      ? draft.edit?.basePrice ?? Math.min(...combinations.map((combination) => combination.price!))
      : base?.price === inputPrice ? draft.edit!.basePrice : inputPrice;
    if (!combinations.length) {
      combinations.push({ color: null, size: null, stock: Number(value("product-stock")), price: base?.price == null ? null : inputPrice,
        image_path: base?.image ?? null, ...(base && { variant_id: base.id, previous_stock: base.stock }) });
    }
    return { uploads: paths, listing: {
      product_id: productId,
      name: draft.name.trim(),
      description: draft.description.trim(),
      category_id: draft.categoryId,
      category_name: draft.categoryName,
      is_active: draft.published,
      is_for_members_only: draft.form.has("org-exclusive"),
      price,
      images,
      video_path: videoPath,
      pickup_contact_person: value("contact-person"),
      pickup_contact_email: value("contact-email"),
      pickup_contact_number: value("contact-number"),
      pickup_social_url: value("contact-social-url") || null,
      preorder_start_date: preorder ? value("pre-order-start") : null,
      preorder_end_date: preorder ? value("pre-order-end") : null,
      combinations,
      ...(draft.edit && { edit_id: crypto.randomUUID(), expected_updated_at: draft.edit.version }),
    } };
  } catch (error) {
    await removeProductUploads(supabase, paths);
    throw error;
  }
}

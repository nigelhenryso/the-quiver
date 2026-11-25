import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_MEDIA_BUCKET = "product-media";
export const PRODUCT_MEDIA_LIMIT = 30 * 1024 * 1024;
const mediaPrefix = `${PRODUCT_MEDIA_BUCKET}/`;

export async function resolveProductMedia(supabase: SupabaseClient, references: (string | null)[]) {
  const paths = [...new Set(references.flatMap((reference) =>
    reference?.startsWith(mediaPrefix) ? [reference.slice(mediaPrefix.length)] : [],
  ))];
  const signed = new Map<string, string>();
  for (let start = 0; start < paths.length; start += 100) {
    const { data, error } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET).createSignedUrls(paths.slice(start, start + 100), 3600);
    if (error) console.error("Could not sign product media", error);
    for (const object of data ?? []) {
      if (object.path && object.signedUrl && !object.error) signed.set(object.path, object.signedUrl);
    }
  }
  return (reference: string | null) => reference?.startsWith(mediaPrefix)
    ? signed.get(reference.slice(mediaPrefix.length)) ?? null
    : reference;
}

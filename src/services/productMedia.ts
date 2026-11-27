import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_MEDIA_BUCKET = "product-media";
export const PRODUCT_MEDIA_LIMIT = 30 * 1024 * 1024;

/** Private buckets whose paths may appear in image_url / cover_video_path columns ("<bucket>/<path>"). */
const SIGNED_BUCKETS = [PRODUCT_MEDIA_BUCKET, "images"] as const;

function splitReference(reference: string | null) {
  if (!reference) return null;
  const bucket = SIGNED_BUCKETS.find((name) => reference.startsWith(`${name}/`));
  return bucket ? { bucket, path: reference.slice(bucket.length + 1) } : null;
}

/** Signs storage references ("product-media/…", "images/…"); other values (full URLs) pass through. */
export async function resolveProductMedia(supabase: SupabaseClient, references: (string | null)[]) {
  const signed = new Map<string, string>();
  for (const bucket of SIGNED_BUCKETS) {
    const paths = [...new Set(references.flatMap((reference) => {
      const parts = splitReference(reference);
      return parts?.bucket === bucket ? [parts.path] : [];
    }))];
    for (let start = 0; start < paths.length; start += 100) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths.slice(start, start + 100), 3600);
      if (error) console.error(`Could not sign ${bucket} media`, error);
      for (const object of data ?? []) {
        if (object.path && object.signedUrl && !object.error) signed.set(`${bucket}/${object.path}`, object.signedUrl);
      }
    }
  }
  return (reference: string | null) => splitReference(reference) ? signed.get(reference!) ?? null : reference;
}

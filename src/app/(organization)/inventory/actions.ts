"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import type { PreparedProduct } from "@/src/services/createProduct";

export async function saveInventoryProduct(listing: PreparedProduct) {
  const supabase = await createClient();
  const rpc = listing.edit_id ? "edit_inventory_product" : "create_inventory_product";
  const { data, error, status } = await supabase.rpc(rpc, { listing });

  if (!error && data === listing.product_id) {
    revalidatePath("/inventory");
    if (listing.edit_id) revalidatePath(`/inventory/${listing.product_id}`);
  }

  return {
    data,
    error: error ? { code: error.code, message: error.message } : null,
    status,
  };
}

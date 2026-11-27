"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { ORDER_CART_ITEM_TABLE, ORDER_CART_TABLE } from "@/src/lib/supabase/tables";
import { getProductDetails } from "@/src/services/productDetailsService";

export type AddToCartResult = { ok: true; cartCount: number } | { ok: false; message: string };

/** Adds one combination of a (non pre-order) product to the student's cart for that organization. */
export async function addToOrderCart(productId: string, combinationId: string, quantity: number): Promise<AddToCartResult> {
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, message: "Choose a valid quantity." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please log in again." };

  const product = await getProductDetails(supabase, productId).catch(() => null);
  if (!product || product.isPreOrder) return { ok: false, message: "This product isn't available." };

  const combination = product.combinations.find((choice) => choice.id === combinationId);
  if (!combination?.inventoryId) return { ok: false, message: "This option isn't available." };

  const { data: cart, error: cartError } = await supabase
    .from(ORDER_CART_TABLE)
    .upsert(
      { student_id: user.id, organization_id: product.organization.id },
      { onConflict: "student_id,organization_id" },
    )
    .select("order_cart_id, OrderCartItem (cart_item_id, inventory_id, quantity)")
    .single<{ order_cart_id: string; OrderCartItem: { cart_item_id: string; inventory_id: string; quantity: number }[] }>();
  if (cartError || !cart) {
    console.error("Could not open cart", cartError);
    return { ok: false, message: "Couldn't add to your cart. Try again." };
  }

  const existing = cart.OrderCartItem.find((item) => item.inventory_id === combination.inventoryId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > combination.stock) {
    return { ok: false, message: `Only ${combination.stock} left${existing ? ` (you already have ${existing.quantity} in your cart)` : ""}.` };
  }

  const { error } = existing
    ? await supabase.from(ORDER_CART_ITEM_TABLE)
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq("cart_item_id", existing.cart_item_id)
    : await supabase.from(ORDER_CART_ITEM_TABLE)
      .insert({ order_cart_id: cart.order_cart_id, inventory_id: combination.inventoryId, quantity });
  if (error) {
    console.error("Could not save cart item", error);
    return { ok: false, message: "Couldn't add to your cart. Try again." };
  }

  revalidatePath("/cart");
  const cartCount = cart.OrderCartItem.reduce((sum, item) => sum + item.quantity, 0) + quantity;
  return { ok: true, cartCount };
}

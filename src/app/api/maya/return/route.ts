import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { MAYA_COOKIE, maya } from "@/src/lib/maya/client";

/**
 * Maya redirects here after checkout. We never trust the redirect alone:
 * the payment is looked up with the secret key before anything is recorded.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const go = (path: string) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    res.cookies.delete(MAYA_COOKIE);
    return res;
  };

  const redirectStatus = req.nextUrl.searchParams.get("status");
  if (redirectStatus !== "success") {
    return go(`/studentOrders?payment=${redirectStatus === "cancel" ? "cancelled" : "failed"}`);
  }

  const raw = req.cookies.get(MAYA_COOKIE)?.value;
  if (!raw) return go("/studentOrders?payment=failed");
  const { checkoutId, orderId, studentId } = JSON.parse(raw) as {
    checkoutId: string;
    orderId: string | null;
    studentId: string;
    amount: number;
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) return go("/studentOrders?payment=failed");

  const { ok, data } = await maya(`/payments/v1/payments/${encodeURIComponent(checkoutId)}`, {
    key: "secret",
  });
  console.log("[maya] payment lookup", checkoutId, JSON.stringify(data, null, 2));
  if (!ok || data.status !== "PAYMENT_SUCCESS") {
    return go("/studentOrders?payment=failed");
  }

  if (orderId) {
    const { data: existing } = await supabase
      .from("Payment")
      .select("payment_id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!existing) {
      const { data: mode } = await supabase
        .from("PaymentMode")
        .select("payment_mode_id")
        .ilike("name", "%maya%")
        .maybeSingle();

      const { error } = await supabase.from("Payment").insert({
        order_id: orderId,
        payment_mode_id: mode?.payment_mode_id,
        amount: Number(data.amount ?? data.totalAmount?.value),
        made_at: new Date().toISOString(),
      });
      if (error) return go(`/studentOrders?payment=record_failed`);
    }
  }

  const details = new URLSearchParams({ payment: "paid" });
  const add = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== "") details.set(k, String(v));
  };
  add("orderId", orderId);
  add("paymentId", data.id ?? checkoutId);
  add("rrn", data.requestReferenceNumber);
  add("receiptNumber", data.receiptNumber);
  add("status", data.status);
  add("amount", data.amount ?? data.totalAmount?.value);
  add("currency", data.currency ?? data.totalAmount?.currency ?? "PHP");
  add("method", data.fundSource?.type ?? data.paymentScheme);
  add("paidAt", data.paymentAt ?? data.updatedAt ?? data.createdAt);

  return go(`/success?${details.toString()}`);
}

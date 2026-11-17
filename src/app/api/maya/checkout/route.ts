import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/src/lib/supabase/server";
import { MAYA_COOKIE, maya } from "@/src/lib/maya/client";

const DEFAULT_AMOUNT = 2; // PHP per transaction

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount ?? DEFAULT_AMOUNT);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const orderId: string | null = body?.orderId ?? null;

  const origin = new URL(req.url).origin;
  const returnUrl = (status: string) => `${origin}/api/maya/return?status=${status}`;

  const { ok, status, data } = await maya("/checkout/v1/checkouts", {
    key: "public",
    method: "POST",
    body: {
      totalAmount: { value: amount, currency: "PHP" },
      requestReferenceNumber: randomUUID(),
      items: [
        {
          name: orderId ? `The Quiver order ${orderId}` : "The Quiver payment",
          quantity: 1,
          totalAmount: { value: amount },
        },
      ],
      redirectUrl: {
        success: returnUrl("success"),
        failure: returnUrl("failure"),
        cancel: returnUrl("cancel"),
      },
    },
  });
  if (!ok || !data.redirectUrl) {
    return NextResponse.json(
      { error: data?.message ?? "Failed to create Maya checkout" },
      { status: ok ? 502 : status },
    );
  }

  // Remember which checkout this browser started, so the return route can verify it.
  const res = NextResponse.json({ redirectUrl: data.redirectUrl });
  res.cookies.set(
    MAYA_COOKIE,
    JSON.stringify({ checkoutId: data.checkoutId, orderId, studentId: user.id, amount }),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 },
  );
  return res;
}

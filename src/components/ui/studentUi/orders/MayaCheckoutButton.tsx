"use client";

import { useState } from "react";

type Props = {
  amount?: number; // PHP, defaults to ₱2
  orderId?: string; // when set, a Payment row is recorded for this order on success
};

export default function MayaCheckoutButton({ amount = 2, orderId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/maya/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");
      window.location.href = data.redirectUrl; // Maya's hosted checkout page
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="rounded-lg bg-[#004D31] px-5 py-2.5 text-white transition hover:bg-[#00623F] disabled:opacity-50"
      >
        {loading ? "Redirecting to Maya…" : `Pay ₱${amount.toFixed(2)} with Maya`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

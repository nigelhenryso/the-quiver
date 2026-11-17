"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  amount?: number; // PHP, defaults to ₱2
  orderId?: string; // when set, a Payment row is recorded for this order on success
  onPaid?: () => void;
};

const isTestMode = process.env.NEXT_PUBLIC_XENDIT_TEST_MODE === "true";

export default function XenditQrphButton({ amount = 2, orderId, onPaid }: Props) {
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [qrString, setQrString] = useState<string | null>(null);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for payment status while a QR is showing
  useEffect(() => {
    if (!paymentRequestId || paid) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/xendit/qrph/${paymentRequestId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not check payment status");
        return;
      }
      if (data.paid) {
        setPaid(true);
        setQrString(null);
        onPaid?.();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [paymentRequestId, paid, onPaid]);

  async function handlePay() {
    setLoading(true);
    setError(null);
    setPaid(false);
    try {
      const res = await fetch("/api/xendit/qrph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      if (!data.qrString) throw new Error("No QR code returned");
      setQrString(data.qrString);
      setPaymentRequestId(data.paymentRequestId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    if (!paymentRequestId) return;
    setSimulating(true);
    setError(null);
    const res = await fetch(`/api/xendit/qrph/${paymentRequestId}/simulate`, { method: "POST" });
    if (!res.ok) setError((await res.json()).error ?? "Simulation failed");
    setSimulating(false);
  }

  if (paid) {
    return <p className="font-medium text-[#004D31]">Payment received. Thank you!</p>;
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="rounded-lg bg-[#004D31] px-5 py-2.5 text-white transition hover:bg-[#00623F] disabled:opacity-50"
      >
        {loading ? "Generating QR…" : `Pay ₱${amount.toFixed(2)} with QRPh`}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {qrString && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-[#004D31]/20 p-4">
          <QRCodeSVG
            value={
              isTestMode && paymentRequestId
                ? `${process.env.NEXT_PUBLIC_DEV_SCAN_BASE_URL ?? window.location.origin}/dev/pay/${paymentRequestId}`
                : qrString
            }
            size={220}
          />
          <p className="text-sm text-[#004D31]">
            {isTestMode ? "Test mode: scan with your phone camera to pay" : "Waiting for payment…"}
          </p>
          {isTestMode && (
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating}
              className="rounded-md border border-dashed border-orange-500 px-3 py-1.5 text-sm text-orange-600 disabled:opacity-50"
            >
              {simulating ? "Simulating…" : "Simulate payment (test mode)"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

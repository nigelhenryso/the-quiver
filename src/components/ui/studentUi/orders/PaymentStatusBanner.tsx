"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  cancelled: "Payment cancelled.",
  failed: "Payment failed or could not be verified.",
  record_failed: "Payment went through but could not be saved. Please contact support.",
};

export default function PaymentStatusBanner() {
  const status = useSearchParams().get("payment");
  if (!status || !MESSAGES[status]) return null;
  return <p className="text-sm text-red-600">{MESSAGES[status]}</p>;
}

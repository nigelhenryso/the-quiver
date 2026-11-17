"use client";

import { useSearchParams } from "next/navigation";

const FIELDS: [key: string, label: string][] = [
  ["paymentId", "Payment / Checkout ID"],
  ["rrn", "Reference no. (RRN)"],
  ["receiptNumber", "Receipt no."],
  ["orderId", "Order ID"],
  ["status", "Status"],
  ["method", "Payment method"],
  ["paidAt", "Paid at"],
];

export default function PaymentResult() {
  const params = useSearchParams();
  if (params.get("payment") !== "paid") return null;

  const amount = params.get("amount");
  const currency = params.get("currency") ?? "PHP";
  const paidAt = params.get("paidAt");

  return (
    <div className="mt-4 w-full max-w-md rounded-lg border border-[#004D31]/20 p-4">
      <p className="mb-3 font-medium text-[#004D31]">
        Payment received{amount ? `: ${currency} ${Number(amount).toFixed(2)}` : ""}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {FIELDS.map(([key, label]) => {
          let value = params.get(key);
          if (!value) return null;
          if (key === "paidAt" && paidAt) value = new Date(paidAt).toLocaleString("en-PH");
          return (
            <div key={key} className="contents">
              <dt className="text-gray-500">{label}</dt>
              <dd className="break-all font-mono text-[#004D31]">{value}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

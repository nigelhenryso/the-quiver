"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Info, Upload, X } from "lucide-react";
import { calSans, lato } from "../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/lib/fonts";
import { getStockStatus, type Product } from "./data";

export type ModalMode = "publish" | "unpublish";

type ConfirmModalProps = {
  mode: ModalMode;
  items: Product[];
  onConfirm: () => void;
  onCancel: () => void;
};

// stock chip colors inside the dark list
const chipColors = {
  in: "border-[#4DB38C] bg-[#2E9A73] text-white",
  low: "border-[#C9B300] bg-[#0A6B3F] text-[#FFE14D]",
  out: "border-[#5C6B3A] bg-[#3E5A3E] text-[#FF8F86]",
} as const;

export default function ConfirmModal({ mode, items, onConfirm, onCancel }: ConfirmModalProps) {
  const isUnpublish = mode === "unpublish";
  const count = items.length;
  const listings = count === 1 ? "Listing" : "Listings";
  const products = count === 1 ? "Product" : "Products";

  const cancelRef = useRef<HTMLButtonElement>(null);

  // focus the safe button first, close with Escape, stop the page behind from scrolling
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  const Icon = isUnpublish ? AlertTriangle : Upload;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[680px] flex-col overflow-hidden rounded-[14px] bg-gradient-to-b from-[#00B574] to-[#69D7B0] text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#004D31] text-white hover:bg-[#003622]"
        >
          <X size={14} />
        </button>

        {/* title + description */}
        <div className="px-7 pb-5 pt-8">
          <h2
            id="confirm-title"
            className={`${calSans.className} flex items-center gap-3 pr-8 text-[30px] leading-tight`}
          >
            <Icon size={28} aria-hidden />
            {isUnpublish ? `Unpublish ${count} ${listings}?` : `Publish ${count} ${listings}?`}
          </h2>
          <p id="confirm-desc" className={`${lato.className} mt-3 text-[14px] leading-snug`}>
            {isUnpublish
              ? "Unpublishing immediately hides these items from the marketplace and prevents new orders, but existing pending orders and stock records remain unaffected."
              : "Publishing immediately puts these items on the marketplace and begins taking new orders, but existing pending orders and stock records remain unaffected."}
          </p>
        </div>

        {/* selected items */}
        <div className="flex-1 overflow-y-auto border-t border-white/25 px-7 py-5">
          <div className={`${lato.className} mb-2 flex justify-between text-[11px] font-bold uppercase tracking-wide`}>
            <span>Selected Items ({count})</span>
            <span>Inventory Status</span>
          </div>

          <ul className="overflow-hidden rounded-[8px] border border-[#006B43] bg-[#008A58]">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 border-b border-[#006B43] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className={`${lato.className} truncate text-[15px] font-bold`}>{p.name}</p>
                  <p className={`${lato.className} mt-0.5 text-[12px] text-white/90`}>
                    Product ID: {p.productId}
                  </p>
                </div>
                <span
                  className={`${lato.className} shrink-0 rounded-[6px] border px-3 py-1 text-[12px] font-bold ${chipColors[getStockStatus(p.stock, p.salesL30D)]}`}
                >
                  Stock: {p.stock}
                </span>
              </li>
            ))}
          </ul>

          <p
            className={`${lato.className} mt-3 flex items-center gap-2 rounded-[6px] bg-[#00804F]/60 px-3 py-2 text-[12px]`}
          >
            <Info size={13} aria-hidden className="shrink-0" />
            {isUnpublish
              ? "You can republish these listings anytime from the Inventory Management Page."
              : "You can unpublish these listings anytime from the Inventory Management Page."}
          </p>
        </div>

        {/* buttons */}
        <div className="flex justify-end gap-3 border-t border-white/25 px-7 py-5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`${calSans.className} rounded-[8px] border border-[#004D31] bg-transparent px-5 py-2.5 text-[15px] text-[#004D31] transition-colors hover:bg-white/30`}
          >
            {isUnpublish ? "Keep Published" : "Keep Unpublished"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${calSans.className} rounded-[8px] bg-[#007A4D] px-5 py-2.5 text-[15px] text-white transition-colors hover:bg-[#004D31]`}
          >
            {isUnpublish ? `Unpublish ${count} ${products}` : `Publish ${count} ${products}`}
          </button>
        </div>
      </div>
    </div>
  );
}
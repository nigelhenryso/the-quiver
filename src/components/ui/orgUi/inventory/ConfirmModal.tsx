"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Info, Trash2, Upload, X } from "lucide-react";
import { calSans, lato } from "@/src/styles/fonts";
import { getStockStatus, type Product } from "@/src/app/(organization)/inventory/data";

export type ModalMode = "publish" | "unpublish" | "delete";

type ConfirmModalProps = {
  mode: ModalMode;
  items: Product[];
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
};

// stock chip colors inside the dark list
const chipColors = {
  in: "border-[#53AE90] bg-[#20946D] text-[#C6ECDF]",
  out: "border-[#A86D54] bg-[#286448] text-[#FF7774]",
} as const;

export default function ConfirmModal({ mode, items, onConfirm, onCancel, saving, error }: ConfirmModalProps) {
  const isUnpublish = mode === "unpublish";
  const isDelete = mode === "delete";
  const action = { publish: "Publish", unpublish: "Unpublish", delete: "Delete" }[mode];
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

  const Icon = { publish: Upload, unpublish: AlertTriangle, delete: Trash2 }[mode];

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
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[654px] flex-col overflow-hidden rounded-[16px] bg-[linear-gradient(180deg,#00B574_26%,#08B779_36%,#69D2AE_92%)] text-[#CEF3E5] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          disabled={saving}
          className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-[#008653] text-[#CDF3E5] enabled:hover:bg-[#006C45] disabled:opacity-60"
        >
          <X size={19} aria-hidden />
        </button>

        {/* title + description */}
        <div className="px-4 pb-5 pt-9 sm:px-7 sm:pt-10">
          <h2
            id="confirm-title"
            className={`${calSans.className} flex items-center gap-2 text-[25px] leading-tight text-[#E2FFF3] sm:text-[32px]`}
          >
            <Icon size={32} aria-hidden className="shrink-0" />
            {isDelete ? "Delete Product?" : `${action} ${count} ${listings}?`}
          </h2>
          <p id="confirm-desc" className={`${lato.className} mt-4 text-[14px] leading-snug sm:text-[16px]`}>
            {isDelete
              ? "This permanently removes the product, its image links, variants, inventory, and cart entries."
              : isUnpublish
              ? "Unpublishing immediately hides these items from the marketplace and prevents new orders, but existing pending orders and stock records remain unaffected."
              : "Publishing immediately puts these items in the marketplace and begins taking new orders, but existing pending orders and stock records remain unaffected."}
          </p>
        </div>

        {error && <p role="alert" className={`${lato.className} mx-7 mb-3 rounded-[6px] bg-white px-3 py-2 text-[13px] text-[#9F241B]`}>{error}</p>}

        {/* selected items */}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#008653] px-4 pb-5 pt-5 sm:px-7 sm:pt-7">
          <div className={`${lato.className} mb-2 flex justify-between gap-2 text-[11px] font-bold uppercase sm:text-[13px]`}>
            <span>Selected Items ({count})</span>
            <span>Inventory Status</span>
          </div>

          <ul className="overflow-hidden rounded-[10px] border border-[#14966C] bg-[#008653]">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-[#14966C] px-3 py-3 last:border-b-0 sm:px-4"
              >
                <div className="min-w-0">
                  <p className={`${lato.className} truncate text-[16px] font-bold`}>{p.name}</p>
                  <p className={`${lato.className} mt-1 break-all text-[13px]`}>
                    Product ID: {p.productId}
                  </p>
                </div>
                <span
                  className={`${lato.className} min-w-[74px] shrink-0 rounded-[8px] border px-3 py-1 text-center text-[13px] font-bold sm:min-w-[78px] ${chipColors[getStockStatus(p.stock)]}`}
                >
                  Stock: {p.stock}
                </span>
              </li>
            ))}
          </ul>

          <p
            className={`${lato.className} mt-2.5 flex items-center gap-1.5 rounded-[8px] border border-[#63A893] bg-[#379575] px-3 py-2.5 text-[13px] font-bold`}
          >
            <Info size={13} aria-hidden className="shrink-0" />
            {isDelete
              ? "Products with orders or preorders can be unpublished instead."
              : isUnpublish
              ? "You can republish these listings anytime from the Inventory Management Page."
              : "You can unpublish these listings anytime from the Inventory Management Page."}
          </p>
        </div>

        {/* buttons */}
        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#008653] px-4 py-4 sm:px-7 sm:pb-5 sm:pt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={`${calSans.className} min-h-11 rounded-[10px] border border-[#004D31] bg-transparent px-4 py-2 text-[16px] text-[#004D31] transition-colors enabled:hover:bg-white/30 disabled:opacity-60 sm:min-w-[106px]`}
          >
            {isUnpublish ? "Keep Published" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={`${calSans.className} min-h-11 rounded-[10px] px-5 py-2 text-[16px] text-white transition-colors disabled:opacity-60 sm:min-w-[185px] ${isDelete ? "bg-[#B42318] enabled:hover:bg-[#8F1D16]" : "bg-[#008653] enabled:hover:bg-[#004D31]"}`}
          >
            {saving ? (isDelete ? "Deleting…" : "Saving…") : isDelete ? "Delete Product" : `${action} ${count} ${products}`}
          </button>
        </div>
      </div>
    </div>
  );
}

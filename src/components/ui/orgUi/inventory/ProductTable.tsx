"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { lato } from "@/src/styles/fonts";
import { StatusPill, StockBadge } from "./badges";
import { formatPhp, type Product } from "@/src/app/(organization)/inventory/data";

export type StockSort = "asc" | "desc" | null;

// checkbox | product | price | stock | performance | category | status | actions
// header and rows share this so the columns line up
const COLS =
  "grid grid-cols-[40px_minmax(240px,1fr)_120px_160px_150px_110px_140px_150px] gap-x-3";

type ProductTableProps = {
  products: Product[]; // only the rows for the current page
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  stockSort: StockSort;
  onSortStock: () => void;
  onTogglePublish: (product: Product) => void;
};

const checkboxClass = "h-4 w-4 cursor-pointer rounded-[4px] accent-[#004D31]";

export default function ProductTable({
  products,
  selected,
  onToggle,
  onToggleAll,
  stockSort,
  onSortStock,
  onTogglePublish,
}: ProductTableProps) {
  const selectedOnPage = products.filter((p) => selected.has(p.id)).length;
  const allSelected = products.length > 0 && selectedOnPage === products.length;

  // "some but not all" state of the header checkbox
  const headRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = selectedOnPage > 0 && !allSelected;
  }, [selectedOnPage, allSelected]);

  const SortIcon = stockSort === "asc" ? ArrowUp : stockSort === "desc" ? ArrowDown : ChevronsUpDown;
  const headText = `${lato.className} text-[13px] font-bold text-[#1E3A2C]`;

  return (
    <div className="min-h-[240px] overflow-x-auto">
      <div className="min-w-[1180px]">
        {/* header */}
        <div className={`${COLS} items-center border-b border-[#1E3A2C] px-5 py-3`}>
          <input
            ref={headRef}
            type="checkbox"
            aria-label="Select all products on this page"
            checked={allSelected}
            onChange={(e) => onToggleAll(e.target.checked)}
            className={checkboxClass}
          />
          <span className={headText}>Products</span>
          <span className={headText}>Price</span>
          <span className={`${headText} flex items-center gap-1`}>
            Stock
            <StockHelp />
            <button
              type="button"
              onClick={onSortStock}
              aria-label={`Sort by stock${
                stockSort === "asc" ? " (lowest first)" : stockSort === "desc" ? " (highest first)" : ""
              }`}
              className="flex rounded p-0.5 text-[#1E3A2C] transition-all duration-200 hover:scale-110 hover:bg-[#E3F5EA]"
            >
              <SortIcon size={13} />
            </button>
          </span>
          <span className={headText}>Performance</span>
          <span className={headText}>Category</span>
          <span className={headText}>Status</span>
          <span className={headText}>Actions</span>
        </div>

        {/* rows */}
        {products.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <div
              key={p.id}
              className={`group/row ${COLS} items-center gap-y-3 border-b border-[#C9D6CE] px-5 py-5 transition-all duration-200 ease-in-out last:border-b-0 ${
                isSelected
                  ? "bg-[#F3FAF5] shadow-[inset_3px_0_0_#004D31]"
                  : "hover:bg-[#F3FFF6] hover:shadow-[inset_3px_0_0_#008A58]"
              }`}
            >
              <input
                type="checkbox"
                aria-label={`Select ${p.name} (${p.productId})`}
                checked={isSelected}
                onChange={() => onToggle(p.id)}
                className={checkboxClass}
              />

              <div className="flex items-center gap-5">
                <Thumb size={58} />
                <div className="min-w-0">
                  <p className={`${lato.className} truncate text-[13px] font-bold text-[#1E3A2C]`}>
                    {p.name}
                  </p>
                  <p className={`${lato.className} mt-0.5 text-[11px] text-[#3F4B54]`}>
                    Product ID: {p.productId}
                  </p>
                </div>
              </div>

              <p className={`${lato.className} text-[13px] font-bold text-[#1E3A2C]`}>
                {formatPhp(p.price)}
              </p>
              <div>
                <StockBadge stock={p.stock} salesL30D={p.salesL30D} />
              </div>
              <Performance sales={p.sales} l30d={p.salesL30D} />
              <p className={`${lato.className} text-[13px] text-[#1E3A2C]`}>{p.category}</p>
              <div>
                <StatusPill published={p.published} />
              </div>

              <div className="flex items-center gap-5">
                {/* TODO: link to the real edit page once it exists */}
                {/* while a row is checked its own actions are dimmed (use the bulk bar instead) */}
                <Link
                  href={`/org/inventory/${p.id}/edit`}
                  aria-disabled={isSelected}
                  tabIndex={isSelected ? -1 : undefined}
                  className={`${lato.className} text-[12px] font-bold transition-all duration-200 hover:scale-110 hover:underline ${
                    isSelected ? "pointer-events-none text-[#B5BEB9]" : "text-[#1E3A2C]"
                  }`}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={isSelected}
                  onClick={() => onTogglePublish(p)}
                  className={`${lato.className} text-[12px] font-bold transition-all duration-200 hover:scale-110 hover:underline ${
                    isSelected
                      ? "cursor-default text-[#B5BEB9] no-underline hover:scale-100 hover:no-underline"
                      : p.published
                        ? "text-[#D0021B]"
                        : "text-[#008A58]"
                  }`}
                >
                  {p.published ? "Unpublish" : "Publish"}
                </button>
              </div>

              {/* variants: gray boxes under the product, lined up with the columns above */}
              {p.variants.map((v) => (
                <div
                  key={v.id}
                  className="col-span-6 col-start-2 grid items-center rounded-[6px] border border-transparent bg-[#F4F4F4] py-3 transition-all duration-200 ease-in-out [grid-template-columns:subgrid] hover:scale-[1.01] hover:border-[#004D31] hover:bg-[#EAF6EF] hover:shadow-md"
                >
                  <div className="flex items-center gap-4 pl-3.5">
                    <Thumb size={46} />
                    <p className={`${lato.className} truncate text-[13px] font-bold text-[#1E3A2C]`}>
                      Variant: {v.name}
                    </p>
                  </div>
                  <p className={`${lato.className} text-[13px] font-bold text-[#1E3A2C]`}>
                    {formatPhp(v.price)}
                  </p>
                  <div>
                    <StockBadge stock={v.stock} salesL30D={v.salesL30D} />
                  </div>
                  <Performance sales={v.sales} l30d={v.salesL30D} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// dark gray box = placeholder for the product image
// TODO: swap for the real product image when the data has one
function Thumb({ size }: { size: number }) {
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className="shrink-0 rounded-[8px] bg-[#5E5E5E] transition-transform duration-200 ease-in-out group-hover/row:scale-105"
    />
  );
}

function Performance({ sales, l30d }: { sales: number; l30d: number }) {
  return (
    <div>
      <p className={`${lato.className} text-[12px] font-bold text-[#1E3A2C]`}>Sales {sales}</p>
      <p className={`${lato.className} mt-0.5 text-[10px] text-[#7C8A82]`}>L30D Sales {l30d}</p>
    </div>
  );
}

// the (?) next to "Stock", shows how Low Stock is decided on hover / keyboard focus
function StockHelp() {
  return (
    <span className="group relative flex">
      <button
        type="button"
        aria-label="How stock status is determined"
        aria-describedby="stock-help"
        className="flex rounded-full text-[#5C6870] hover:text-[#004D31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008A58]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>

      <span
        id="stock-help"
        role="tooltip"
        className={`${lato.className} invisible absolute left-1/2 top-full z-30 mt-2 w-[320px] -translate-x-1/2 rounded-[6px] border border-[#BFE3C9] bg-[#F3FFF6] p-3 text-left text-[11px] font-normal leading-snug text-[#1E3A2C] opacity-0 shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100`}
      >
        <span className="block">Determined by the Additional Inventory Required (A.I.R.)</span>
        <span className="mt-2 block">
          A.I.R. = Average daily orders (<b>L30D Sales/30</b>) * Desired number of days stock
          should last - Stock
        </span>
        <span className="mt-2 block">
          A product will be considered <b>Low Stock</b> if the A.I.R. is greater than 0.
        </span>
      </span>
    </span>
  );
}
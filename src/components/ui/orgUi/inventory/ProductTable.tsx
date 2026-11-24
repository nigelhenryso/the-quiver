"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { lato } from "@/src/styles/fonts";
import { StatusPill, StockBadge } from "./badges";
import { formatPhp, getProductCategories, type Product } from "@/src/app/(organization)/inventory/data";

export type StockSort = "asc" | "desc" | null;

// checkbox | product | price | stock | performance | category | status | actions
// header and rows share this so the columns line up
const COLS =
  "grid grid-cols-[40px_minmax(240px,1fr)_120px_160px_150px_110px_140px_170px] gap-x-3";

type ProductTableProps = {
  products: Product[]; // only the rows for the current page
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  stockSort: StockSort;
  onSortStock: () => void;
  onTogglePublish: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const checkboxClass = "h-4 w-4 cursor-pointer rounded-[2px] checked:accent-[#004D31] checked:appearance-auto appearance-none border border-[#CBC7C7] hover:bg-[#004D3115]";

export default function ProductTable({
  products,
  selected,
  onToggle,
  onToggleAll,
  stockSort,
  onSortStock,
  onTogglePublish,
  onDelete,
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

              <div className="flex items-center gap-3">
                <Thumb size={58} imageUrl={p.imageUrl} />
                <div className="min-w-0">
                  <p className={`${lato.className} truncate text-[13px] font-bold text-[#1E3A2C]`}>
                    {p.name}
                  </p>
                  <p className={`${lato.className} mt-0.5 break-all text-[11px] text-[#3F4B54]`}>
                    Product ID: {p.productId}
                  </p>
                </div>
              </div>

              <p className={`${lato.className} text-[13px] font-bold text-[#1E3A2C]`}>
                {formatPhp(p.price)}
              </p>
              <div>
                <StockBadge stock={p.stock} />
              </div>
              <Performance sales={p.sales} />
              <p className={`${lato.className} text-[13px] text-[#1E3A2C]`}>
                {getProductCategories(p).join(", ")}
              </p>
              <div>
                <StatusPill published={p.isActive} />
              </div>

              <div className="flex items-center gap-5">
                {/* While a row is checked, use the bulk bar to change publication status. */}
                <Link
                  href={`/inventory/${p.productId}`}
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
                      : p.isActive
                        ? "text-[#D0021B]"
                        : "text-[#008A58]"
                  }`}
                >
                  {p.isActive ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => onDelete(p)}
                  className={`${lato.className} text-[12px] font-bold text-[#B42318] hover:underline`}
                >
                  Delete
                </button>
              </div>

              {p.variants.length > 0 && (
                <div className="col-start-2 col-end-[-1] grid gap-y-2 rounded-[8px] border border-[#EBEBEB] bg-[#FAFAFA] px-2 py-3 [grid-template-columns:subgrid]">
                  <h3 className={`${lato.className} col-span-full pl-3.5 text-[13px] font-bold text-[#1E3A2C]`}>
                    Variants
                  </h3>
                  {p.variants.map((v) => (
                    <div
                      key={v.id}
                      className="col-span-full grid items-center rounded-[6px] border border-transparent bg-[#F4F4F4] py-3 transition-all duration-200 ease-in-out [grid-template-columns:subgrid] hover:scale-[1.01] hover:border-[#004D31] hover:bg-[#EAF6EF] hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 pl-3.5">
                        <Thumb size={46} imageUrl={v.imageUrl ?? p.imageUrl} />
                        <div className={`${lato.className} min-w-0 text-[13px] text-[#1E3A2C]`}>
                          {v.sku && <p className="break-words font-bold">{v.sku}</p>}
                          <ul role="list" className="mt-0.5 list-disc space-y-0.5 break-words pl-4 text-[11px] text-[#3F4B54]">
                            {v.options.map(({ id, label }) => <li key={id}>{label}</li>)}
                          </ul>
                        </div>
                      </div>
                      <p className={`${lato.className} text-[13px] font-bold text-[#1E3A2C]`}>
                        {formatPhp(v.price)}
                      </p>
                      <div>
                        <StockBadge stock={v.stock} />
                      </div>
                      <Performance sales={v.sales} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Thumb({ size, imageUrl }: { size: number; imageUrl: string | null }) {
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className="shrink-0 overflow-hidden rounded-[8px] bg-[#5E5E5E] transition-transform duration-200 ease-in-out group-hover/row:scale-105"
    >
      {imageUrl && <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
    </div>
  );
}

function Performance({ sales }: { sales: number }) {
  return <p className={`${lato.className} text-[12px] font-bold text-[#1E3A2C]`}>Sales {sales}</p>;
}

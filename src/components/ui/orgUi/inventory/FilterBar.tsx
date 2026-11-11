"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { lato } from "../../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/lib/fonts";
import { categories, stockStatusLabel, type Category, type StockStatus } from "./data";

export type PerformanceSort = "default" | "sales-asc" | "sales-desc" | "l30d-asc" | "l30d-desc";

export type Filters = {
  search: string;
  categories: Category[]; // checked categories (all checked = no filter)
  stock: StockStatus[]; // checked stock statuses (all checked = no filter)
  performance: PerformanceSort;
};

export const stockStatuses: StockStatus[] = ["in", "low", "out"];

export const defaultFilters: Filters = {
  search: "",
  categories: [...categories],
  stock: [...stockStatuses],
  performance: "default",
};

const performanceOptions: { value: PerformanceSort; label: string }[] = [
  { value: "default", label: "Sales Performance" },
  { value: "sales-asc", label: "Lowest to Highest Sales" },
  { value: "sales-desc", label: "Highest to Lowest Sales" },
  { value: "l30d-asc", label: "Lowest to Highest L30D Sales" },
  { value: "l30d-desc", label: "Highest to Lowest L30D Sales" },
];

type FilterBarProps = {
  value: Filters; // the draft, only applied when "Apply" is clicked
  onChange: (next: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  categoryCounts: Record<Category, number>;
  stockCounts: Record<StockStatus, number>;
  total: number;
};

const controlClass = `${lato.className} h-[36px] w-full rounded-[6px] border border-[#C9D6CE] bg-white px-3 text-[12px] text-[#1E3A2C] outline-none transition-all duration-200 ease-in-out hover:border-[#004D31] hover:shadow-md focus:border-[#008A58] focus:ring-1 focus:ring-[#008A58]`;

// adds the value if it is not in the list yet, removes it if it is (keeps the original order)
function toggleIn<T>(all: T[], current: T[], item: T): T[] {
  return current.includes(item)
    ? current.filter((x) => x !== item)
    : all.filter((x) => x === item || current.includes(x));
}

export default function FilterBar({
  value,
  onChange,
  onApply,
  onReset,
  categoryCounts,
  stockCounts,
  total,
}: FilterBarProps) {
  // ex: "Category: All (20)" / "Category: Shirt, Pins"
  const summary = (name: string, labels: string[], allCount: number) =>
    labels.length === allCount
      ? `${name}: All (${total})`
      : labels.length === 0
        ? `${name}: None`
        : `${name}: ${labels.join(", ")}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
      onReset={(e) => {
        e.preventDefault();
        onReset();
      }}
      className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#C9D6CE] bg-white p-3.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
    >
      {/* search */}
      <div className="relative min-w-[220px] flex-[1.6]">
        <Search
          size={13}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5C8F78]"
        />
        <input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search org merchandise"
          aria-label="Search org merchandise"
          className={`${controlClass} pl-8 placeholder:text-[#8DBBA6]`}
        />
      </div>

      {/* category (multi select) */}
      <MultiSelect
        label="Category"
        buttonText={summary("Category", value.categories, categories.length)}
        options={categories.map((c) => ({ value: c, label: `${c} (${categoryCounts[c]})` }))}
        checked={value.categories}
        onToggle={(c) =>
          onChange({ ...value, categories: toggleIn(categories, value.categories, c as Category) })
        }
      />

      {/* stock status (multi select) */}
      <MultiSelect
        label="Stock status"
        buttonText={summary(
          "Stock Status",
          value.stock.map((s) => stockStatusLabel[s]),
          stockStatuses.length,
        )}
        options={stockStatuses.map((s) => ({
          value: s,
          label: `${stockStatusLabel[s]} (${stockCounts[s]})`,
        }))}
        checked={value.stock}
        onToggle={(s) =>
          onChange({ ...value, stock: toggleIn(stockStatuses, value.stock, s as StockStatus) })
        }
      />

      {/* sales performance (sort) */}
      <div className="relative min-w-[180px] flex-1">
        <select
          value={value.performance}
          onChange={(e) => onChange({ ...value, performance: e.target.value as PerformanceSort })}
          aria-label="Sales performance"
          className={`${controlClass} cursor-pointer appearance-none pr-8`}
        >
          {performanceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#008A58]"
        />
      </div>

      <div className="ml-auto flex gap-3">
        <button
          type="submit"
          className={`${lato.className} h-[36px] rounded-[6px] bg-[#008A58] px-5 text-[12px] font-bold text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-[#006B44] hover:shadow-lg active:scale-100`}
        >
          Apply
        </button>
        <button
          type="reset"
          className={`${lato.className} h-[36px] rounded-[6px] border border-[#2F8F6B] bg-white px-5 text-[12px] font-bold text-[#2F8F6B] transition-all duration-200 ease-in-out hover:scale-105 hover:border-[#004D31] hover:bg-[#F3FFF6] hover:shadow-md active:scale-100`}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

// dropdown with a checkbox for each option, used by Category and Stock Status
function MultiSelect({
  label,
  buttonText,
  options,
  checked,
  onToggle,
}: {
  label: string;
  buttonText: string;
  options: { value: string; label: string }[];
  checked: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-[180px] flex-1">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${controlClass} flex items-center justify-between text-left`}
      >
        <span className="truncate">{buttonText}</span>
        <ChevronDown size={14} className="shrink-0 text-[#008A58]" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-[6px] border border-[#C9D6CE] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
        >
          {options.map((o) => {
            const isChecked = checked.includes(o.value);
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isChecked}
                className="border-b border-[#E4E9E6] last:border-b-0"
              >
                <label
                  className={`${lato.className} flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] text-[#1E3A2C] hover:bg-[#F3FFF6]`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(o.value)}
                    className="peer sr-only"
                  />
                  <span className="flex h-[14px] w-[14px] items-center justify-center rounded-[4px] border border-[#004D31] bg-white text-white peer-checked:bg-[#004D31] peer-focus-visible:ring-2 peer-focus-visible:ring-[#008A58]">
                    {isChecked && <Check size={10} strokeWidth={3.5} />}
                  </span>
                  {o.label}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
"use client";

import CalendarRangePicker from "./CalendarRangePicker";
import type { SalesRange } from "@/src/types/Sales";

export const RANGES: SalesRange[] = ["Today", "This Month", "This Term", "This Year", "All-Time", "Custom Range"];

type Props = {
  value: SalesRange;
  onChange: (range: SalesRange) => void;
  custom: { from: string; to: string };
  onCustomChange: (custom: { from: string; to: string }) => void;
};

// segmented date-range control; shows a calendar range picker when "Custom Range" is picked
export default function RangeFilter({ value, onChange, custom, onCustomChange }: Props) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div
        role="radiogroup"
        aria-label="Sales date range"
        className="flex flex-wrap gap-1 rounded-[8px] border border-[#DCE6E0] bg-white p-1"
      >
        {RANGES.map((range) => {
          const active = range === value;
          return (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(range)}
              className={`font-body h-[26px] rounded-[6px] px-3 text-[11px] transition-colors ${
                active ? "bg-[#004D31] font-bold text-white" : "text-[#4A5A51] hover:bg-[#E8F7EE]"
              }`}
            >
              {range}
            </button>
          );
        })}
      </div>

      {value === "Custom Range" && (
        <CalendarRangePicker value={custom} onChange={onCustomChange} />
      )}
    </div>
  );
}

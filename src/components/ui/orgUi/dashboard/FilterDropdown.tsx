"use client";

import { ChevronDown } from "lucide-react";

type FilterDropdownProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  ariaLabel: string;
};

// small pill dropdown that sits in the top-right corner of a stat card
export default function FilterDropdown<T extends string>({ value, options, onChange, ariaLabel }: FilterDropdownProps<T>) {
  return (
    <div className="relative inline-flex h-[20px] items-center rounded-[6px] border border-[#BFE3C9] bg-[#E8F7EE] text-[#2F4531]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={ariaLabel}
        className="font-body h-full cursor-pointer appearance-none bg-transparent [color-scheme:light] py-0 pl-2 pr-5 text-[10px] font-bold leading-[20px] outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-white text-[#2F4531]">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={11} strokeWidth={2.5} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
    </div>
  );
}

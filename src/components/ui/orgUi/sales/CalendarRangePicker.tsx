"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { manilaDateKey } from "@/src/lib/sales";

type Range = { from: string; to: string }; // "YYYY-MM-DD" or ""

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based

function prettyDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// button + popover calendar; first click picks the start day, second click the end day
export default function CalendarRangePicker({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  const today = manilaDateKey(new Date());
  const start = value.from || today;
  const [open, setOpen] = useState(true); // opens right away when "Custom Range" is picked
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 });
  const [hover, setHover] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(day: string) {
    if (value.from && !value.to && day >= value.from) {
      onChange({ from: value.from, to: day });
      setOpen(false);
    } else {
      onChange({ from: day, to: "" });
    }
  }

  function shiftMonth(delta: number) {
    setView(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  }

  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => keyOf(view.year, view.month, i + 1)),
  ];

  // end of the highlighted span: the chosen end, or the hovered day while choosing it
  const spanEnd = value.to || (value.from && hover >= value.from ? hover : "");

  const label = value.from
    ? `${prettyDate(value.from)} – ${value.to ? prettyDate(value.to) : "Pick end date"}`
    : "Pick start date";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="font-body inline-flex h-[30px] items-center gap-2 rounded-[6px] border border-[#C9D6CE] bg-white px-3 text-[11px] text-[#1E3A2C] hover:border-[#008A58]"
      >
        <CalendarDays size={14} className="text-[#008A58]" aria-hidden />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date range"
          className="absolute right-0 top-[calc(100%+6px)] z-40 w-[260px] rounded-[10px] border border-[#DCE6E0] bg-white p-3 shadow-[0_6px_16px_rgba(0,0,0,0.15)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded p-1 text-[#004D31] hover:bg-[#E8F7EE]">
              <ChevronLeft size={16} />
            </button>
            <span className="font-body text-[12px] font-bold text-[#1E3A2C]">
              {new Date(Date.UTC(view.year, view.month, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded p-1 text-[#004D31] hover:bg-[#E8F7EE]">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center" onMouseLeave={() => setHover("")}>
            {WEEKDAYS.map((d) => (
              <span key={d} className="font-body text-[9.5px] font-bold text-[#8C9A92]">{d}</span>
            ))}
            {cells.map((day, i) => {
              if (!day) return <span key={`blank-${i}`} />;
              const isEdge = day === value.from || day === value.to;
              const inSpan = value.from && spanEnd && day > value.from && day < spanEnd;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  onMouseEnter={() => setHover(day)}
                  aria-pressed={isEdge}
                  className={`font-body h-[30px] text-[11px] transition-colors ${
                    isEdge
                      ? "rounded-[6px] bg-[#004D31] font-bold text-white"
                      : inSpan
                        ? "bg-[#E8F7EE] text-[#004D31]"
                        : `rounded-[6px] hover:bg-[#E8F7EE] ${day === today ? "font-bold text-[#008A58]" : "text-[#1E3A2C]"}`
                  }`}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#E3EBE6] pt-2">
            <button
              type="button"
              onClick={() => onChange({ from: "", to: "" })}
              className="font-body text-[10.5px] text-[#5E7A6A] hover:underline"
            >
              Clear
            </button>
            <span className="font-body text-[10px] text-[#8C9A92]">
              {value.from && !value.to ? "Now pick the end date" : "Pick a start date"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

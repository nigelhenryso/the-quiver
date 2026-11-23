"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { filterByRange, manilaDateKey, paidOrdersCsv, rangeBounds, summarizeSales } from "@/src/lib/sales";
import type { SalesOrder, SalesRange } from "@/src/types/Sales";
import RangeFilter from "./RangeFilter";
import TotalSalesCard from "./TotalSalesCard";
import BestSellerCard from "./BestSellerCard";
import CategoryBreakdown from "./CategoryBreakdown";

export default function SalesClient({ orders, nowIso }: { orders: SalesOrder[]; nowIso: string }) {
  const [range, setRange] = useState<SalesRange>("This Month");
  const [custom, setCustom] = useState({ from: "", to: "" });

  const bounds = useMemo(() => rangeBounds(range, new Date(nowIso), custom), [range, custom, nowIso]);
  const inRange = useMemo(() => filterByRange(orders, bounds), [orders, bounds]);

  // every metric on the page uses Claimed orders only
  const summary = useMemo(() => summarizeSales(inRange.filter((o) => o.status === "Claimed")), [inRange]);

  const rangeLabel =
    range === "Custom Range"
      ? bounds.from || bounds.to
        ? `${bounds.from ?? "Start"} – ${bounds.to ?? "Today"}`
        : "All dates"
      : range;

  function exportCsv() {
    const csv = paidOrdersCsv(inRange);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }); // BOM so Excel reads ₱/ñ
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paid-orders_${range.toLowerCase().replace(/\s+/g, "-")}_${manilaDateKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-[#DCE6E0] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-[32px] text-[#004D31] sm:text-[36px]">Sales</h1>
          <p className="font-body mt-1 text-[12.5px] text-[#5E7A6A]">
            Track real-time merchandise sale metrics of your organization.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-3 lg:justify-end">
          <RangeFilter value={range} onChange={setRange} custom={custom} onCustomChange={setCustom} />
          <button
            type="button"
            onClick={exportCsv}
            className="font-body inline-flex h-[34px] items-center gap-2 rounded-[6px] bg-[#008A58] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[#004D31]"
          >
            <Upload size={14} aria-hidden /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[230px_1fr]">
        <div className="flex flex-col gap-4">
          <TotalSalesCard revenue={summary.revenue} units={summary.units} rangeLabel={rangeLabel} />
          <BestSellerCard product={summary.bestSeller} totalRevenue={summary.revenue} />
        </div>
        <CategoryBreakdown categories={summary.byCategory} revenue={summary.revenue} units={summary.units} />
      </div>
    </>
  );
}

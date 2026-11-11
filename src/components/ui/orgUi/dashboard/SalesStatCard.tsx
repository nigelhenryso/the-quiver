"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import StatCard from "./StatCard";
import { formatPeso, type SalesByPeriod, type SalesPeriod } from "@/src/app/(organization)/dashboard/data";


const periods: SalesPeriod[] = ["Monthly", "Weekly", "Yearly"];

// the Total Monthly Sales card, the badge is a dropdown that changes the period
// this is a client component because of the dropdown
export default function SalesStatCard({ salesByPeriod }: { salesByPeriod: SalesByPeriod }) {
  const [period, setPeriod] = useState<SalesPeriod>("Monthly");

  const dropdown = (
    <div className="relative">
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as SalesPeriod)}
        aria-label="Sales period"
        className={`$font-body cursor-pointer appearance-none rounded-full border border-[#BFE3C9] bg-[#E8F7EE] py-[2px] pl-2 pr-5 text-[9px] font-bold text-[#2F4531] outline-none`}
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <ChevronDown
        size={10}
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#2F4531]"
      />
    </div>
  );

  return (
    <StatCard
      value={formatPeso(salesByPeriod[period])}
      label={`Total ${period} Sales`}
      badge={dropdown}
      linkLabel="View Sales Data"
      href="#" // TODO: link to the sales page once it exists
    />
  );
}
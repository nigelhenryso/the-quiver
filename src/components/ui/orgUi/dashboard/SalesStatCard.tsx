"use client";

import { useState } from "react";
import StatCard from "./StatCard";
import FilterDropdown from "./FilterDropdown";
import { formatPeso } from "@/src/lib/utils";
import type { SalesPeriod } from "@/src/types/Dashboard";

const periods: SalesPeriod[] = ["Weekly", "Monthly", "Yearly"];

// sales card; the badge is a dropdown that switches the period
export default function SalesStatCard({
  salesByPeriod,
  initialPeriod = "Monthly",
}: {
  salesByPeriod: Record<SalesPeriod, number>;
  initialPeriod?: SalesPeriod;
}) {
  const [period, setPeriod] = useState<SalesPeriod>(initialPeriod);

  const dropdown = (
    <FilterDropdown value={period} options={periods} onChange={setPeriod} ariaLabel="Sales period" />
  );

  return (
    <StatCard
      value={formatPeso(salesByPeriod[period])}
      label={`Total ${period} Sales`}
      badge={dropdown}
      linkLabel="View Sales Data"
      href="/sales"
    />
  );
}

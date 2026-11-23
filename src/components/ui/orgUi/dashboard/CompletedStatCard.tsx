"use client";

import { useState } from "react";
import StatCard from "./StatCard";
import FilterDropdown from "./FilterDropdown";
import type { MonthlyCompletion } from "@/src/types/Dashboard";

// completed-orders card; the badge is a month dropdown, the % moves to the footer
export default function CompletedStatCard({ completionByMonth }: { completionByMonth: MonthlyCompletion[] }) {
  const [month, setMonth] = useState(completionByMonth[0]?.month ?? "");
  const selected = completionByMonth.find((m) => m.month === month) ?? completionByMonth[0];

  const completed = selected?.completed ?? 0;
  const total = selected?.total ?? 0;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isCurrent = selected?.month === completionByMonth[0]?.month;

  const dropdown = (
    <FilterDropdown
      value={month}
      options={completionByMonth.map((m) => m.month)}
      onChange={setMonth}
      ariaLabel="Completion month"
    />
  );

  return (
    <StatCard
      value={`${completed}/${total}`}
      label={isCurrent ? "Completed This Month" : `Completed in ${selected?.month.split(" ")[0]}`}
      badge={dropdown}
      footnote={`${percent}% completed`}
      linkLabel="View Orders"
      href="/orgOrders"
    />
  );
}

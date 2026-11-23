import StatCard, { Badge } from "./StatCard";
import SalesStatCard from "./SalesStatCard";
import CompletedStatCard from "./CompletedStatCard";
import type { DashboardStats, MonthlyCompletion, SalesPeriod } from "@/src/types/Dashboard";

type QuickViewProps = {
  stats: DashboardStats;
  salesByPeriod: Record<SalesPeriod, number>;
  completionByMonth: MonthlyCompletion[];
};

export default function QuickView({
  stats,
  salesByPeriod,
  completionByMonth,
}: QuickViewProps) {
  return (
    <section className="rounded-[10px] border border-[#C9D6CE] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.25)] sm:px-7 sm:py-6">
      <h2 className="font-heading border-b border-[#BFE3C9] pb-2 text-[24px] text-[#2F4531]">Quick View</h2>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          value={stats.pendingPaymentVerification}
          label="Orders for Processing"
          badge={<Badge tone="warning">Needs Review</Badge>}
          linkLabel="View More"
          href="/orgOrders"
        />
        <StatCard
          value={stats.pendingClaim}
          label="Pending Claim"
          badge={<Badge tone="warning">Needs Review</Badge>}
          linkLabel="View More"
          href="/orgOrders"
        />
        <CompletedStatCard completionByMonth={completionByMonth} />
        <SalesStatCard salesByPeriod={salesByPeriod} />
      </div>
    </section>
  );
}

import StatCard, { Badge } from "./StatCard";
import SalesStatCard from "./SalesStatCard";
import { ORG_LINKS } from "@/src/lib/routes";
import type { DashboardStats, SalesByPeriod } from "@/src/types/Dashboard";

type QuickViewProps = {
  stats: DashboardStats;
  salesByPeriod: SalesByPeriod;
};

// the "Quick View" panel with the 4 stat cards
export default function QuickView({ stats, salesByPeriod }: QuickViewProps) {
  const completedPercent =
    stats.totalOrdersThisMonth === 0
      ? 0
      : Math.round((stats.completedThisMonth / stats.totalOrdersThisMonth) * 100);

  return (
    <section className="rounded-[10px] border border-[#C9D6CE] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.25)] sm:px-7 sm:py-6">
      <h2 className="font-heading border-b border-[#BFE3C9] pb-2 text-[24px] text-[#2F4531]">
        Quick View
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          value={stats.pendingPaymentVerification}
          label="Pending Payment Verification"
          badge={<Badge tone="warning">Needs Review</Badge>}
          linkLabel="Verify now"
          href={ORG_LINKS.orders("pending-verification")}
        />
        <StatCard
          value={stats.pendingClaim}
          label="Pending Claim"
          badge={<Badge tone="warning">Needs Review</Badge>}
          linkLabel="View More"
          href={ORG_LINKS.orders("pending-claim")}
        />
        <StatCard
          value={`${stats.completedThisMonth}/${stats.totalOrdersThisMonth}`}
          label="Completed This Month"
          badge={<Badge>{completedPercent}% Completed</Badge>}
          linkLabel="View Orders"
          href={ORG_LINKS.orders("completed")}
        />
        <SalesStatCard salesByPeriod={salesByPeriod} />
      </div>
    </section>
  );
}

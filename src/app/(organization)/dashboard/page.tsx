import StatCard, { Badge } from "../../../components/ui/orgUi/dashboard/StatCard";
import SalesStatCard from "../../../components/ui/orgUi/dashboard/SalesStatCard";
import RecentOrders from "../../../components/ui/orgUi/dashboard/RecentOrders";
import { getDashboardData } from "@/src/app/(organization)/dashboard/data";

export const metadata = {
  title: "Dashboard | The Quiver Seller Hub",
};

export default function OrgDashboardPage() {
  // dummy data for now
  const { orgName, stats, salesByPeriod, recentOrders } = getDashboardData();

  const completedPercent = Math.round(
    (stats.completedThisMonth / stats.totalOrdersThisMonth) * 100,
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC]">
      {/* loggedIn without student shows the org header */}

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-10 lg:px-10">
        <h1 className={`$font-heading text-[32px] text-[#199E72] sm:text-[36px]`}>
          &lt;{orgName}&gt;&apos;s Dashboard
        </h1>
        <p className={`$font-body mt-1 text-[12.5px] text-[#8DBBA6]`}>
          View data analytics from your sales and orders.
        </p>

        {/* quick view: the 4 number cards */}
        <section className="mt-8 rounded-[10px] border border-[#C9D6CE] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.25)] sm:px-7 sm:py-6">
          <h2
            className={`$font-heading border-b border-[#BFE3C9] pb-2 text-[24px] text-[#2F4531]`}
          >
            Quick View
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              value={stats.pendingPaymentVerification}
              label="Pending Payment Verification"
              badge={<Badge tone="warning">Needs Review</Badge>}
              linkLabel="Verify now"
              href="/org/orders"
            />
            <StatCard
              value={stats.pendingClaim}
              label="Pending Claim"
              badge={<Badge tone="warning">Needs Review</Badge>}
              linkLabel="View More"
              href="/org/orders"
            />
            <StatCard
              value={`${stats.completedThisMonth}/${stats.totalOrdersThisMonth}`}
              label="Completed This Month"
              badge={<Badge>{completedPercent}% Completed</Badge>}
              linkLabel="View Orders"
              href="/org/orders"
            />
            <SalesStatCard salesByPeriod={salesByPeriod} />
          </div>
        </section>

        {/* recent orders */}
        <div className="mt-10">
          <RecentOrders orders={recentOrders} />
        </div>
      </main>
    </div>
  );
}
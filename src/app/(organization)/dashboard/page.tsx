import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import QuickView from "@/src/components/ui/orgUi/dashboard/QuickView";
import RecentOrders from "@/src/components/ui/orgUi/dashboard/RecentOrders";
import { createClient } from "@/src/lib/supabase/server";
import { getOrgDashboard } from "@/src/services/dashboardService";

export const metadata = {
  title: "Organization Dashboard",
};

export default function OrgDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-10 lg:px-10">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}

async function DashboardContent() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const dashboard = await getOrgDashboard(supabase, user.id);

  if (!dashboard) {
    return (
      <p className="font-body py-16 text-center text-[14px] text-[#7C8A82]">
        No organization profile is linked to this account.
      </p>
    );
  }

  return (
    <>
      <h1 className="font-heading text-[32px] text-[#199E72] sm:text-[36px]">{dashboard.orgName}&apos;s Dashboard</h1>
      <p className="font-body mt-1 text-[12.5px] text-[#8DBBA6]">View data analytics from your sales and orders.</p>

      <div className="mt-8">
        <QuickView
          stats={dashboard.stats}
          salesByPeriod={dashboard.salesByPeriod}
          completionByMonth={dashboard.completionByMonth}
        />
      </div>

      <div className="mt-10">
        <RecentOrders orders={dashboard.recentOrders} />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-[8px] bg-[#E3F5EA]";
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className={`${block} h-10 w-72`} />
      <div className={`${block} mt-2 h-4 w-60`} />
      <div className="mt-8 grid grid-cols-1 gap-5 rounded-[10px] border border-[#C9D6CE] bg-white p-5 sm:grid-cols-2 sm:px-7 sm:py-6 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${block} h-[150px]`} />
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-6 rounded-[10px] border border-[#C9D6CE] bg-white p-5 sm:px-7 sm:py-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`${block} h-[124px]`} />
        ))}
      </div>
    </div>
  );
}

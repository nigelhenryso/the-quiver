import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import SalesClient from "@/src/components/ui/orgUi/sales/SalesClient";
import { createClient } from "@/src/lib/supabase/server";
import { getOrgSales } from "@/src/services/salesService";

export const metadata = {
  title: "Organization Sales",
};

export default function OrgSalesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAF9]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-10 lg:px-10">
        <Suspense fallback={<SalesSkeleton />}> {/* Suspense waits for the data to be fetched */}
          <SalesContent />
        </Suspense>
      </main>
    </div>
  );
}

async function SalesContent() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const sales = await getOrgSales(supabase, user.id);

  if (!sales) {
    return (
      <p className="font-body py-16 text-center text-[14px] text-[#7C8A82]">
        No organization profile is linked to this account.
      </p>
    );
  }

  return <SalesClient orders={sales.orders} nowIso={new Date().toISOString()} />;
}

function SalesSkeleton() {
  const block = "animate-pulse rounded-[8px] bg-[#E3F5EA]";
  return (
    <div aria-busy="true" aria-label="Loading sales">
      <div className={`${block} h-10 w-40`} />
      <div className={`${block} mt-2 h-4 w-72`} />
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[230px_1fr]">
        <div className="flex flex-col gap-4">
          <div className={`${block} h-[120px]`} />
          <div className={`${block} h-[180px]`} />
        </div>
        <div className={`${block} h-[320px]`} />
      </div>
    </div>
  );
}

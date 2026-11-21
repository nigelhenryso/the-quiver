import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import InventoryClient from "../../../components/ui/orgUi/inventory/InventoryClient";
import { createClient } from "@/src/lib/supabase/server";
import { ORGANIZATION_TABLE } from "@/src/lib/supabase/tables";
import { getOrgInventory } from "@/src/services/inventoryService";
import { PAGE_SIZE } from "./data";
import { Footer } from "@/src/components/ui/Footer";

export const metadata = {
  title: "Inventory | The Quiver Seller Hub",
};

export default function OrgInventoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-7 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={`font-heading text-[32px] text-[#004D31] sm:text-[36px] mb-0`}>
              Inventory
            </h1>
            <p className={`font-body mt-0 text-[14px] text-[#5C8F78]`}>
              Manage organization merchandise, catalog listings, stock levels, and publication
              status.
            </p>
          </div>

          <Link
            href="/inventory/new"
            className={`font-body flex items-center gap-2 rounded-[6px] bg-[#008A58] pl-2.5 pr-3 py-1.5 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:bg-[#006B44] hover:shadow-lg active:scale-100`}
          >
            <Plus size={14} aria-hidden />
            Add New Product
          </Link>
        </div>

        <Suspense fallback={<InventorySkeleton />}>
          <InventoryContent />
        </Suspense>
      </main>
    </div>
  );
}

function InventorySkeleton() {
  const pulse = "bg-[#E3F5EA] motion-safe:animate-pulse";
  const block = `${pulse} rounded-[8px]`;

  return (
    <>
      <p role="status" className="sr-only">Loading inventory…</p>
      <div aria-hidden="true" className="mt-6 border-t border-[#DDE5E0] pt-5">
        <div className="flex flex-wrap gap-3">
          <div className={`${pulse} h-10 w-20 rounded-full`} />
          <div className={`${pulse} h-10 w-24 rounded-full`} />
          <div className={`${pulse} h-10 w-36 rounded-full`} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#C9D6CE] bg-white p-3.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
          <div className={`${block} h-9 min-w-[220px] flex-[1.6]`} />
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={`${block} h-9 min-w-[180px] flex-1`} />
          ))}
          <div className="ml-auto flex gap-3">
            <div className={`${block} h-9 w-[70px]`} />
            <div className={`${block} h-9 w-[70px]`} />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[10px] border border-[#C9D6CE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
          <div className="overflow-x-auto">
            <div className="min-w-[1180px]">
              <div className="border-b border-[#C9D6CE] px-5 py-3">
                <div className={`${block} h-4 w-full`} />
              </div>
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <div key={index} className="flex items-center gap-6 border-b border-[#C9D6CE] px-5 py-5 last:border-b-0">
                  <div className={`${pulse} size-4 shrink-0 rounded-sm`} />
                  <div className={`${block} size-[58px] shrink-0`} />
                  <div className="w-40 shrink-0 space-y-2">
                    <div className={`${block} h-4 w-full`} />
                    <div className={`${block} h-3 w-28`} />
                  </div>
                  <div className={`${block} h-5 flex-1`} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C9D6CE] px-6 py-4">
            <div className={`${block} h-4 w-44`} />
            <div className={`${block} h-8 w-28`} />
          </div>
        </div>
      </div>
    </>
  );
}

async function InventoryContent() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  try {
    const { data: organization, error } = await supabase
      .from(ORGANIZATION_TABLE)
      .select("organization_id")
      .eq("organization_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!organization) {
      return <p className="mt-6">No organization profile is linked to this account.</p>;
    }

    const products = await getOrgInventory(supabase, user.id);
    return <InventoryClient initialProducts={products} />;
  } catch (error) {
    console.error("Failed to load organization inventory", error);
    return <p role="alert" className="mt-6">Couldn’t load inventory. Refresh the page to try again.</p>;
  }
}

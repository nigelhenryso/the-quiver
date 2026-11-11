import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/app/components/ui/Header";
import { braahOne, lato } from "../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/lib/fonts";
import InventoryClient from "./InventoryClient";
import { getInventoryData } from "./data";

export const metadata = {
  title: "Inventory | The Quiver Seller Hub",
};

export default function OrgInventoryPage() {
  // dummy data for now
  const products = getInventoryData();

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC]">
      <Header loggedIn />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-10 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`${braahOne.className} text-[32px] text-[#004D31] sm:text-[36px]`}>
              Inventory
            </h1>
            <p className={`${lato.className} mt-1 text-[14px] text-[#5C8F78]`}>
              Manage organization merchandise, catalog listings, stock levels, and publication
              status.
            </p>
          </div>

          {/* TODO: link to the add product page once it exists */}
          <Link
            href="/org/inventory/new"
            className={`${lato.className} flex items-center gap-2 rounded-[6px] bg-[#008A58] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:bg-[#006B44] hover:shadow-lg active:scale-100`}
          >
            <Plus size={14} aria-hidden />
            Add New Product
          </Link>
        </div>

        <InventoryClient initialProducts={products} />
      </main>

      <footer className="border-t border-[#C9D6CE] bg-[#F3FFF6] py-4 text-center">
        <p className={`${braahOne.className} text-[12px] text-[#199E72]`}>
          © 2026 The Quiver. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
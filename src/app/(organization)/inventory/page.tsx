import Link from "next/link";
import { Plus } from "lucide-react";
import InventoryClient from "../../../components/ui/orgUi/inventory/InventoryClient";
import { getInventoryData } from "./data";

export const metadata = {
  title: "Inventory | The Quiver Seller Hub",
};

export default function OrgInventoryPage() {
  // dummy data for now
  const products = getInventoryData();

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-10 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`font-heading text-[32px] text-[#004D31] sm:text-[36px]`}>
              Inventory
            </h1>
            <p className={`font-body mt-1 text-[14px] text-[#5C8F78]`}>
              Manage organization merchandise, catalog listings, stock levels, and publication
              status.
            </p>
          </div>

          {/* TODO: link to the add product page once it exists */}
          <Link
            href="/org/inventory/new"
            className={`font-body flex items-center gap-2 rounded-[6px] bg-[#008A58] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:bg-[#006B44] hover:shadow-lg active:scale-100`}
          >
            <Plus size={14} aria-hidden />
            Add New Product
          </Link>
        </div>

        <InventoryClient initialProducts={products} />
      </main>
    </div>
  );
}
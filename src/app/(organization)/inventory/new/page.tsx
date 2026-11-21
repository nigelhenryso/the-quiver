import { Suspense } from "react";
import { connection } from "next/server";
import AddProductForm from "@/src/components/ui/orgUi/inventory/AddProductForm";
import AddProductFormSkeleton from "@/src/components/ui/orgUi/inventory/AddProductFormSkeleton";
import { createClient } from "@/src/lib/supabase/server";
import { TAG_TABLE } from "@/src/lib/supabase/tables";

export const metadata = {
  title: "Add New Product | The Quiver Seller Hub",
};

export default function OrgAddProductPage() {
  return (
    <div data-add-product-page className="flex min-h-[calc(100vh-59px)] flex-col bg-[#FDFFFC] pb-[var(--product-action-bar-height,0px)]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-7 lg:px-10">
        <h1 className="font-heading mb-0 text-[32px] text-[#004D31] sm:text-[36px]">
          Add New Product
        </h1>
        <p className="font-body mt-0 text-[14px] text-[#5C8F78]">
          List a new merchandise or pre-order item on the campus marketplace.
        </p>
        <div className="mt-6 border-t border-[#DDE5E0]" />

        <Suspense fallback={<AddProductFormSkeleton />}>
          <AddProductContent />
        </Suspense>
      </main>
    </div>
  );
}

async function AddProductContent() {
  await connection();

  const supabase = await createClient();
  const { data: tags, error } = await supabase
    .from(TAG_TABLE)
    .select("tag_id, name")
    .order("name")
    .order("tag_id");

  if (error) {
    console.error("Failed to load product tags", error);
    return <p role="alert" className="mt-6">Couldn’t load product categories. Refresh the page to try again.</p>;
  }

  return <AddProductForm tags={tags} showListingDetails />;
}

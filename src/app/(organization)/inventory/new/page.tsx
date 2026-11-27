import { connection } from "next/server";
import { redirect } from "next/navigation";
import AddProductForm from "@/src/components/ui/orgUi/inventory/AddProductForm";
import ProductFormPage from "@/src/components/ui/orgUi/inventory/ProductFormPage";
import { createClient } from "@/src/lib/supabase/server";
import { CATEGORY_TABLE, ORGANIZATION_TABLE } from "@/src/lib/supabase/tables";

export const metadata = {
  title: "Add New Product | The Quiver Seller Hub",
};

export default function OrgAddProductPage() {
  return (
    <ProductFormPage title="Add New Product" description="List a new merchandise or pre-order item on the campus marketplace.">
      <AddProductContent />
    </ProductFormPage>
  );
}

async function AddProductContent() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: organization, error: organizationError } = await supabase
    .from(ORGANIZATION_TABLE).select("organization_id").eq("organization_id", user.id).maybeSingle();
  if (organizationError) {
    console.error("Could not load the seller profile", organizationError);
    return <p role="alert" className="mt-6">Couldn’t load your organization. Refresh the page to try again.</p>;
  }
  if (!organization) return <p className="mt-6">No organization profile is linked to this account.</p>;

  const { data: categories, error } = await supabase
    .from(CATEGORY_TABLE)
    .select("category_id, name")
    .order("name")
    .order("category_id");

  if (error) {
    console.error("Failed to load product categories", error);
    return <p role="alert" className="mt-6">Couldn’t load product categories. Refresh the page to try again.</p>;
  }

  return <AddProductForm categories={categories} showListingDetails />;
}

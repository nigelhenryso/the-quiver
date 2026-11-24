import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import AddProductForm from "@/src/components/ui/orgUi/inventory/AddProductForm";
import ProductFormPage from "@/src/components/ui/orgUi/inventory/ProductFormPage";
import { createClient } from "@/src/lib/supabase/server";
import { TAG_TABLE } from "@/src/lib/supabase/tables";
import { getEditableProduct } from "@/src/services/editProduct";

export const metadata = { title: "Edit Product | The Quiver Seller Hub" };

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  return (
    <ProductFormPage title="Edit Product" description="Update the details of an existing listing.">
      <EditProductContent params={params} />
    </ProductFormPage>
  );
}

async function EditProductContent({ params }: { params: Promise<{ productId: string }> }) {
  await connection();
  const { productId } = await params;
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(productId)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [product, tags] = await Promise.allSettled([
    getEditableProduct(supabase, productId, user.id),
    supabase.from(TAG_TABLE).select("tag_id, name").order("name").order("tag_id"),
  ]);
  if (product.status === "fulfilled" && !product.value) notFound();
  if (product.status === "rejected" || tags.status === "rejected" || tags.value.error) {
    console.error("Could not load product for editing", product.status === "rejected" ? product.reason : null,
      tags.status === "rejected" ? tags.reason : tags.value.error);
    return <p role="alert" className="mt-6">Couldn’t load the product details. Refresh the page to try again.</p>;
  }
  if (!product.value) notFound();
  return <AddProductForm key={productId} tags={tags.value.data} showListingDetails existing={product.value} />;
}

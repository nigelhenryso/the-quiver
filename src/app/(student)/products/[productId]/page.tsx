// Figma Page: Student - ORDER Product Details Page
// Only regular (order) products have this page. Pre-order products get a 404.

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import ProductOverview from "@/src/components/ui/studentUi/productDetails/ProductOverview";
import ProductReviews from "@/src/components/ui/studentUi/productDetails/ProductReviews";
import { createClient } from "@/src/lib/supabase/server";
import { getOrgCartCount, getProductDetails } from "@/src/services/productDetailsService";

export const metadata = {
  title: "Product | The Quiver",
};

type Params = Promise<{ productId: string }>;

async function Product({ params }: { params: Params }) {
  await connection();
  const { productId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const product = await getProductDetails(supabase, decodeURIComponent(productId));
  if (!product || product.isPreOrder) notFound();

  const cartCount = await getOrgCartCount(supabase, user.id, product.organization.id);

  return (
    <>
      <title>{`${product.name} | The Quiver`}</title>
      <ProductOverview product={product} initialCartCount={cartCount} />

      <section aria-labelledby="description-heading" className="mt-12 max-w-2xl font-body text-[#2F4531]">
        <h2 id="description-heading" className="font-heading text-xl">Description</h2>
        <p className="mt-2 whitespace-pre-line text-sm [overflow-wrap:anywhere]">
          {product.description?.trim() || "No description yet."}
        </p>
      </section>

      <div className="mt-12 max-w-2xl pb-24">
        <ProductReviews reviews={product.reviews} />
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="grid animate-pulse gap-8 md:grid-cols-2 md:gap-12">
      <div className="aspect-[4/5] rounded-md bg-[#B9D8A6]" />
      <div className="space-y-3">
        <div className="h-3 w-1/3 rounded bg-[#D4EBC8]" />
        <div className="h-8 w-2/3 rounded bg-[#D4EBC8]" />
        <div className="h-5 w-1/4 rounded bg-[#D4EBC8]" />
        <div className="h-24 rounded bg-[#E6F8DF]" />
        <div className="h-10 rounded bg-[#D4EBC8]" />
        <div className="h-10 rounded bg-[#D4EBC8]" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FDFFFC] to-[#EBFFE0]">
      <div className="mx-auto w-full max-w-[920px] px-5 py-10 sm:px-8">
        <Suspense fallback={<ProductSkeleton />}>
          <Product params={params} />
        </Suspense>
      </div>
    </main>
  );
}

import { cache, Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Home, { OrgProductRows } from "@/src/components/ui/studentUi/home/Home";
import ProductRowSkeleton from "@/src/components/ui/studentUi/home/ProductRowSkeleton";
import { createClient } from "@/src/lib/supabase/server";
import { getExploreProducts, getPreOrderProducts, getYourOrgProducts } from "@/src/services/studentDashboardService";

export const metadata = {
  title: "Home | The Quiver",
};

export default function StudentHomePage() {
  return (
    <Home
      yourOrgs={
        <Suspense fallback={<ProductRowSkeleton label="Loading your organizations…" />}>
          <YourOrganizations />
        </Suspense>
      }
      preOrders={
        <Suspense fallback={<ProductRowSkeleton label="Loading pre-orders…" />}>
          <PreOrderCatalog />
        </Suspense>
      }
      exploreMore={
        <Suspense fallback={<ProductRowSkeleton label="Loading more products…" />}>
          <ExploreCatalog />
        </Suspense>
      }
    />
  );
}

const getStudentSession = cache(async () => {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return { supabase, studentId: user.id };
});

async function YourOrganizations() {
  const { supabase, studentId } = await getStudentSession();

  try {
    const rows = await getYourOrgProducts(supabase, studentId);
    return rows.length > 0
      ? <OrgProductRows rows={rows} />
      : <p className="ml-5 font-body text-sm text-[#506552]">You haven’t joined any organizations yet.</p>;
  } catch (error) {
    console.error("Could not load products from joined organizations", error);
    return <p role="alert" className="ml-5 font-body text-sm text-[#506552]">Couldn’t load your organizations. Refresh to try again.</p>;
  }
}

async function PreOrderCatalog() {
  const { supabase, studentId } = await getStudentSession();

  try {
    const rows = await getPreOrderProducts(supabase, studentId);
    return rows.length > 0
      ? <OrgProductRows rows={rows} />
      : <p className="ml-5 font-body text-sm text-[#506552]">No pre-orders are available yet.</p>;
  } catch (error) {
    console.error("Could not load pre-order products", error);
    return <p role="alert" className="ml-5 font-body text-sm text-[#506552]">Couldn’t load pre-orders. Refresh to try again.</p>;
  }
}

async function ExploreCatalog() {
  const { supabase, studentId } = await getStudentSession();

  try {
    const rows = await getExploreProducts(supabase, studentId);
    return rows.length > 0
      ? <OrgProductRows rows={rows} />
      : <p className="ml-5 font-body text-sm text-[#506552]">No products from other organizations are available yet.</p>;
  } catch (error) {
    console.error("Could not load products from other organizations", error);
    return <p role="alert" className="ml-5 font-body text-sm text-[#506552]">Couldn’t load Explore More. Refresh to try again.</p>;
  }
}

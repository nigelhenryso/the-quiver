import { cache, Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Home, { OrgProductRows } from "@/src/components/ui/studentUi/home/Home";
import { createClient } from "@/src/lib/supabase/server";
import { getStudentHomeData } from "./data";
import { getPreOrderProducts, getYourOrgProducts } from "./orgProducts";

export const metadata = {
  title: "Home | The Quiver",
};

export default function StudentHomePage() {
  return (
    <Home
      {...getStudentHomeData()}
      yourOrgs={
        <Suspense fallback={<p role="status" className="ml-5 font-body text-sm text-[#506552]">Loading your organizations…</p>}>
          <YourOrganizations />
        </Suspense>
      }
      preOrders={
        <Suspense fallback={<p role="status" className="ml-5 font-body text-sm text-[#506552]">Loading pre-orders…</p>}>
          <PreOrderCatalog />
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
  const { supabase } = await getStudentSession();

  try {
    const rows = await getPreOrderProducts(supabase);
    return rows.length > 0
      ? <OrgProductRows rows={rows} />
      : <p className="ml-5 font-body text-sm text-[#506552]">No pre-orders are available yet.</p>;
  } catch (error) {
    console.error("Could not load pre-order products", error);
    return <p role="alert" className="ml-5 font-body text-sm text-[#506552]">Couldn’t load pre-orders. Refresh to try again.</p>;
  }
}

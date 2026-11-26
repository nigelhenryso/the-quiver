import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Home, { OrgProductRows } from "@/src/components/ui/studentUi/home/Home";
import { createClient } from "@/src/lib/supabase/server";
import { getStudentHomeData } from "./data";
import { getYourOrgProducts } from "./yourOrgs";

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
    />
  );
}

async function YourOrganizations() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  try {
    const rows = await getYourOrgProducts(supabase, user.id);
    return rows.length > 0
      ? <OrgProductRows rows={rows} />
      : <p className="ml-5 font-body text-sm text-[#506552]">You haven’t joined any organizations yet.</p>;
  } catch (error) {
    console.error("Could not load products from joined organizations", error);
    return <p role="alert" className="ml-5 font-body text-sm text-[#506552]">Couldn’t load your organizations. Refresh to try again.</p>;
  }
}

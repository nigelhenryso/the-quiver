// Figma Page: Student - Campus Orgs
import { Suspense } from "react";
import CampusOrgs from "@/src/components/ui/studentUi/campusOrgs/campus_orgs/CampusOrgs";
import { getCampusOrgsData } from "./data";

export const metadata = {
  title: "Campus Orgs | The Quiver",
};

async function CampusOrgsContent() {
  const { yourOrgs, otherOrgs } = await getCampusOrgsData();
  return <CampusOrgs yourOrgs={yourOrgs} otherOrgs={otherOrgs} />;
}

export default function StudentCampusOrgsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#FBFFFB] to-[#E4FFCC]" />}>
      <CampusOrgsContent />
    </Suspense>
  );
}

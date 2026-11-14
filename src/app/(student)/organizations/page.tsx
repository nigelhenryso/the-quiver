// Figma Page: Student - Campus Orgs
import CampusOrgs from "@/src/components/ui/studentUi/campusOrgs/campus_orgs/CampusOrgs";
import { getCampusOrgsData } from "./data";

export const metadata = {
  title: "Campus Orgs | The Quiver",
};

export default function StudentCampusOrgsPage() {
  // dummy data for now
  const { yourOrgs, collegeOrgs, allOrgs } = getCampusOrgsData();

  return <CampusOrgs yourOrgs={yourOrgs} collegeOrgs={collegeOrgs} allOrgs={allOrgs} />;
}
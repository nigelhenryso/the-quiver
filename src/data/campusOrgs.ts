// dummy data for the student campus orgs page
// NOTE: replace this with real data from supabase

export type Org = {
  id: number;
  name: string;
  college: string; // college the org belongs to, ex: "CCS"
  logoUrl?: string; // leave out for now, the card shows a placeholder
};

// pretend this is the logged in student
const studentCollege = "CCS";
const joinedOrgIds = [1, 5, 7, 10];

const allOrgs: Org[] = [
  { id: 1, name: "Animo Tech Society", college: "CCS" },
  { id: 2, name: "Green Archers Fanclub", college: "CLA" },
  { id: 3, name: "Lasallian Business Circle", college: "COB" },
  { id: 4, name: "Science Majors Guild", college: "COS" },
  { id: 5, name: "Game Dev Collective", college: "CCS" },
  { id: 6, name: "Engineering Council", college: "GCOE" },
  { id: 7, name: "Cyber Security Club", college: "CCS" },
  { id: 8, name: "Education Majors United", college: "BAGCED" },
  { id: 9, name: "Writers' Society", college: "CLA" },
  { id: 10, name: "Data Science Hub", college: "CCS" },
  { id: 11, name: "Entrepreneurs' Society", college: "COB" },
  { id: 12, name: "Robotics Circle", college: "GCOE" },
];

export function getCampusOrgsData() {
  const yourOrgs = allOrgs.filter((org) => joinedOrgIds.includes(org.id));
  const collegeOrgs = allOrgs.filter((org) => org.college === studentCollege);

  return { yourOrgs, collegeOrgs, allOrgs };
}

// data for the student campus orgs page (from supabase)

import { connection } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  ORGANIZATION_IMAGE_TABLE,
  ORGANIZATION_TABLE,
  STUDENT_AFFILIATION_TABLE,
} from "@/src/lib/supabase/tables";

export type Org = {
  id: string; // organization_id
  name: string;
  acronym: string;
  logoUrl?: string; // first OrganizationImage of the org, card shows a placeholder if none
};

type OrgRow = {
  organization_id: string;
  name: string;
  acronym: string;
  OrganizationImage: { image_url: string }[] | null;
};

export async function getCampusOrgsData() {
  // opt out of prerendering first: supabase auth reads Date.now() internally
  await connection();

  const supabase = await createClient();

  const [{ data: orgRows, error: orgError }, { data: userData }] = await Promise.all([
    supabase
      .from(ORGANIZATION_TABLE)
      .select(`organization_id, name, acronym, ${ORGANIZATION_IMAGE_TABLE}(image_url)`)
      .order("name")
      .returns<OrgRow[]>(),
    supabase.auth.getUser(),
  ]);

  if (orgError) console.error("Failed to load organizations:", orgError.message);

  const allOrgs: Org[] = (orgRows ?? []).map((row) => ({
    id: row.organization_id,
    name: row.name,
    acronym: row.acronym,
    logoUrl: row.OrganizationImage?.[0]?.image_url,
  }));

  // orgs the logged in student is affiliated with
  let yourOrgs: Org[] = [];
  const userId = userData.user?.id;
  if (userId) {
    const { data: affiliations, error: affError } = await supabase
      .from(STUDENT_AFFILIATION_TABLE)
      .select("organization_id")
      .eq("student_id", userId);

    if (affError) console.error("Failed to load affiliations:", affError.message);

    const joinedIds = new Set((affiliations ?? []).map((a) => a.organization_id));
    yourOrgs = allOrgs.filter((org) => joinedIds.has(org.id));
  }

  // every org the student isn't in (all of them if they have none)
  const yourIds = new Set(yourOrgs.map((org) => org.id));
  const otherOrgs = allOrgs.filter((org) => !yourIds.has(org.id));

  return { yourOrgs, otherOrgs };
}

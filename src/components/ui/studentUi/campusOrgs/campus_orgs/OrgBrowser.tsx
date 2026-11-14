"use client";

import { useState } from "react";
import { ArrowDownUp, Funnel } from "lucide-react";
import type { Org } from "@/src/app/(student)/organizations/data";
import OrgSection from "./OrgSection";

type OrgBrowserProps = {
  search: string; // comes from the search bar in the header
  yourOrgs: Org[];
  collegeOrgs: Org[];
  allOrgs: Org[];
};

// filter / sort buttons + the three org sections
// this is a client component because of the sort
export default function OrgBrowser({ search, yourOrgs, collegeOrgs, allOrgs }: OrgBrowserProps) {
  const [sortAZ, setSortAZ] = useState(false); // false = original order

  // keeps only the orgs that match the search, then sorts if needed
  function applySearchAndSort(orgs: Org[]) {
    const query = search.trim().toLowerCase();
    let result = orgs.filter((org) => org.name.toLowerCase().includes(query));

    if (sortAZ) {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }

  const shownYourOrgs = applySearchAndSort(yourOrgs);
  const shownCollegeOrgs = applySearchAndSort(collegeOrgs);
  const shownAllOrgs = applySearchAndSort(allOrgs);

  const nothingFound =
    shownYourOrgs.length === 0 && shownCollegeOrgs.length === 0 && shownAllOrgs.length === 0;

  return (
    <>
      {/* the icon buttons (search is in the header now) */}
      <div className="mt-8 flex items-center justify-end gap-4 text-[#6CC832]">
        {/* TODO: filter by college once we have real data */}
        <button
          type="button"
          aria-label="Filter"
          className="cursor-pointer transition-colors duration-300 hover:text-[#199E72]"
        >
          <Funnel size={20} fill="currentColor" />
        </button>
        <button
          type="button"
          aria-label="Sort A to Z"
          aria-pressed={sortAZ}
          onClick={() => setSortAZ(!sortAZ)}
          className={`cursor-pointer transition-colors duration-300 hover:text-[#199E72] ${
            sortAZ ? "text-[#199E72]" : ""
          }`}
        >
          <ArrowDownUp size={20} />
        </button>
      </div>

      {/* the sections (hidden if the search has no matches in them) */}
      <div className="mt-8 flex flex-col gap-12">
        {shownYourOrgs.length > 0 && <OrgSection title="Your Orgs" orgs={shownYourOrgs} />}
        {shownCollegeOrgs.length > 0 && (
          <OrgSection title="Your College's Orgs" orgs={shownCollegeOrgs} />
        )}
        {shownAllOrgs.length > 0 && <OrgSection title="All Orgs" orgs={shownAllOrgs} />}

        {nothingFound && (
          <p className={`font-body text-center text-[14px] text-[#8DBBA6]`}>
            No orgs found for &quot;{search}&quot;.
          </p>
        )}
      </div>
    </>
  );
}
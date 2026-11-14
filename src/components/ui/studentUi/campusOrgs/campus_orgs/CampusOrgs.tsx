"use client";

import { useState } from "react";
import { Footer } from "../../../Footer";
import type { Org } from "@/src/app/(student)/organizations/data";
import OrgBrowser from "./OrgBrowser";

type CampusOrgsProps = {
  yourOrgs: Org[];
  collegeOrgs: Org[];
  allOrgs: Org[];
};

// the whole campus orgs page: header (with search), title, org sections, footer
// this is a client component because the search lives in the header (same as the home page)
export default function CampusOrgs({ yourOrgs, collegeOrgs, allOrgs }: CampusOrgsProps) {
  const [search, setSearch] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#FBFFFB] to-[#E4FFCC]">
      {/* loggedIn + student shows the student header, passing the search makes the search bar show up */}

      <main className="mx-auto w-full max-w-[960px] flex-1 px-5 pb-16 pt-12 sm:px-8">
        <h1 className={`font-heading text-[32px] text-[#199E72] sm:text-[36px]`}>
          Campus Orgs
        </h1>
        <p className={`font-body mt-1 text-[12.5px] text-[#8DBBA6]`}>
          Shop for merchandise by campus organizations.
        </p>

        <OrgBrowser
          search={search}
          yourOrgs={yourOrgs}
          collegeOrgs={collegeOrgs}
          allOrgs={allOrgs}
        />
      </main>

      <Footer />
    </div>
  );
}
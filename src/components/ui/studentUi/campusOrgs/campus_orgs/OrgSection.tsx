import type { Org } from "@/src/app/(student)/organizations/data";
import OrgCard from "./OrgCard";

type OrgSectionProps = {
  title: string;
  orgs: Org[];
};

// a heading + a grid of org cards (Your Orgs, Your College's Orgs, All Orgs)
export default function OrgSection({ title, orgs }: OrgSectionProps) {
  return (
    <section>
      <h2 className={`font-heading text-[26px] text-[#4DB88A]`}>{title}</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {orgs.map((org) => (
          <OrgCard key={org.id} org={org} />
        ))}
      </div>
    </section>
  );
}

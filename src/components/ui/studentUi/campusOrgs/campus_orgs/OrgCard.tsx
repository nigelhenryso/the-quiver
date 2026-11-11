import type { Org } from "@/src/app/(student)/organizations/data";

type OrgCardProps = {
  org: Org;
};

// one of the light green org boxes
// TODO: link this to the org's merch page once that page exists
export default function OrgCard({ org }: OrgCardProps) {
  return (
    <button
      type="button"
      title={org.name}
      aria-label={org.name}
      className="flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] bg-[#BDEE8F] shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
    >
      {org.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={org.logoUrl} alt={`${org.name} logo`} className="h-full w-full object-cover" />
      ) : (
        <span className={`font-heading text-[20px] text-[#1E3A2C]`}>Org Logo</span>
      )}
    </button>
  );
}

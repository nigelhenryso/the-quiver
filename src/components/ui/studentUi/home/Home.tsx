import type { ReactNode } from "react";
import type { HomeOrgProducts } from "@/src/app/(student)/landing/data";
import ProductRow, { OrgAvatar } from "./productRow";

type HomeProps = {
  yourOrgs: ReactNode;
  preOrders: ReactNode;
  exploreMore: ReactNode;
};

export default function Home({ yourOrgs, preOrders, exploreMore }: HomeProps) {
  const sections = [
    { id: "your-orgs", title: "Your Orgs", content: yourOrgs },
    { id: "pre-order", title: "Pre-order Now!", content: preOrders },
    { id: "explore-more", title: "Explore More", content: exploreMore },
  ];

  return (
    <main className="flex min-h-screen w-full flex-col gap-10 bg-[#FCFCFC] px-5 pb-10 pt-[7.5rem] sm:px-8 md:pt-9">
      {sections.map(({ id, title, content }) => (
        <section key={id} aria-labelledby={id}>
          <h2 id={id} className="ml-5 mb-1 font-heading text-[32px] text-[#199E72]">
            {title}
          </h2>
          {content}
        </section>
      ))}
    </main>
  );
}

export function OrgProductRows({ rows }: { rows: HomeOrgProducts[] }) {
  return (
    <div className="space-y-3">
      {rows.map(({ id, ...row }) => row.products.length > 0 ? (
        <ProductRow key={id} {...row} />
      ) : (
        <div key={id} className="rounded-lg bg-[#E6F8DF] p-3 font-body text-sm text-[#506552] sm:px-4">
          <div className="flex items-center gap-2">
            <OrgAvatar src={row.orgImageUrl} />
            <h3 className="font-bold">{row.orgName}</h3>
          </div>
          <p className="mt-1">No published products yet.</p>
        </div>
      ))}
    </div>
  );
}

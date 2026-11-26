import type { HomeOrgProducts } from "@/src/app/(student)/landing/data";
import ProductRow from "./productRow";

type HomeProps = {
  yourOrgs: HomeOrgProducts[];
  preOrders: HomeOrgProducts[];
  exploreMore: HomeOrgProducts[];
};

export default function Home({ yourOrgs, preOrders, exploreMore }: HomeProps) {
  const sections = [
    { id: "your-orgs", title: "Your Orgs", rows: yourOrgs },
    { id: "pre-order", title: "Pre-order Now!", rows: preOrders },
    { id: "explore-more", title: "Explore More", rows: exploreMore },
  ];

  return (
    <main className="flex min-h-screen w-full flex-col gap-10 bg-[#FCFCFC] px-5 pb-10 pt-[7.5rem] sm:px-8 md:pt-9">
      {sections.map(({ id, title, rows }) => (
        <section key={id} aria-labelledby={id}>
          <h2 id={id} className="ml-5 mb-1 font-heading text-[32px] text-[#199E72]">
            {title}
          </h2>
          <div className="space-y-3">
            {rows.map(({ orgName, products }) => (
              <ProductRow key={orgName} orgName={orgName} products={products} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

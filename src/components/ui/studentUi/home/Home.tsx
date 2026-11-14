"use client";

import { useState } from "react";
import type { HomeProduct } from "../../../../app/(student)/landing/data";
import { Header } from "../../Header";
import { Footer } from "../../Footer";
import Banner from "./Banner";
import ProductRow from "./productRow";
import HomeProductCard from "./productCard";

type HomeProps = {
  forYou: HomeProduct[];
  fromYourOrgs: HomeProduct[];
  exploreMore: HomeProduct[];
  promoSlides: string[];
};

// the whole student home page: header (with search), promo banner, product sections, footer
// this is a client component because the search lives in the header
export default function Home({ forYou, fromYourOrgs, exploreMore, promoSlides }: HomeProps) {
  const [search, setSearch] = useState("");

  // matches product name or org name
  function applySearch(products: HomeProduct[]) {
    const query = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(query) || p.orgName.toLowerCase().includes(query),
    );
  }

  const shownForYou = applySearch(forYou);
  const shownFromYourOrgs = applySearch(fromYourOrgs);
  const shownExploreMore = applySearch(exploreMore);

  const nothingFound =
    shownForYou.length === 0 && shownFromYourOrgs.length === 0 && shownExploreMore.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#F2FFEE]">
      {/* loggedIn + student shows the student header, passing the search makes the search bar show up */}
      {/*<Header loggedIn student searchValue={search} onSearchChange={setSearch} />*/}

      <Banner slides={promoSlides} label="Promos and events" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-14 px-6 pb-16 pt-10 lg:px-10">
        {shownForYou.length > 0 && <ProductRow title="For You" products={shownForYou} />}

        {shownFromYourOrgs.length > 0 && (
          <ProductRow title="From Your Orgs" products={shownFromYourOrgs} />
        )}

        {shownExploreMore.length > 0 && (
          <section>
            <h2 className={`font-heading text-[32px] leading-tight text-[#4DB88A]`}>
              Explore More
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-5 px-2 py-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
              {shownExploreMore.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {nothingFound && (
          <p className={`font-body text-center text-[14px] text-[#8DBBA6]`}>
            No products found for &quot;{search}&quot;.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
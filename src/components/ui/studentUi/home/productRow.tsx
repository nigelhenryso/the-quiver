"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeProduct } from "../../../../app/(student)/landing/data";
import HomeProductCard from "./productCard";

type ProductRowProps = {
  title: string;
  products: HomeProduct[];
};

// heading + one row of 7 product cards (For You, From Your Orgs)
// on small screens the row scrolls, and the arrows show up
export default function ProductRow({ title, products }: ProductRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // checks if there is more to see on each side (decides the arrow colors)
  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }, []);

  // check on load, when the products change (search), and when the window resizes
  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [products, updateArrows]);

  // scroll by about one "page" of cards
  const scrollRow = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  };

  // no arrows when every card already fits on screen
  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <section>
      <h2 className={`font-heading text-[32px] leading-tight text-[#4DB88A]`}>{title}</h2>

      <div className="relative mt-3">
        {/* arrows: dark = there is more to see, light = nothing more that way */}
        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            className={`absolute -left-3 top-1/2 z-10 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors ${
              canScrollLeft
                ? "cursor-pointer bg-[#244A36] hover:bg-[#3C7657]"
                : "cursor-default bg-[#6E9C77]/60"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex gap-5 overflow-x-auto scroll-smooth px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            // 7 cards fit in one row; below 150px each, the row scrolls instead
            <div key={product.id} className="w-[calc((100%-120px)/7)] min-w-[150px] flex-none">
              <HomeProductCard product={product} />
            </div>
          ))}
        </div>

        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollRow(1)}
            disabled={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            className={`absolute -right-3 top-1/2 z-10 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors ${
              canScrollRight
                ? "cursor-pointer bg-[#244A36] hover:bg-[#3C7657]"
                : "cursor-default bg-[#6E9C77]/60"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}
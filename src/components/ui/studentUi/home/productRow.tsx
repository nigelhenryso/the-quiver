"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeOrgProducts } from "@/src/app/(student)/landing/data";
import HomeProductCard from "./productCard";

const arrowClass =
  "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-[#244432] text-white shadow-[1px_2px_3px_#24443255] hover:bg-[#356049] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244432] disabled:bg-[#6E8E7B] disabled:text-white/50";

export function OrgAvatar({ src }: { src?: string }) {
  return (
    <span aria-hidden="true" className="size-9 shrink-0 overflow-hidden rounded-full bg-[#D7D7D7]">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
        />
      )}
    </span>
  );
}

export default function ProductRow({ orgName, orgImageUrl, products }: Omit<HomeOrgProducts, "id">) {
  const headingId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [products, updateArrows]);

  function scrollRow(direction: -1 | 1) {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth });
  }

  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <section aria-labelledby={headingId} className="min-w-0 rounded-lg bg-[#E6F8DF] p-3 sm:px-4">
      <div className="flex items-center gap-2 font-body text-[#506552]">
        <OrgAvatar src={orgImageUrl} />
        <h3 id={headingId} className="text-sm font-bold">{orgName}</h3>
      </div>

      <div className="relative mt-2">
        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            disabled={!canScrollLeft}
            aria-label={`Previous products from ${orgName}`}
            className={`${arrowClass} -left-2`}
          >
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={3} />
          </button>
        )}

        <ul
          ref={trackRef}
          onScroll={updateArrows}
          tabIndex={0}
          aria-labelledby={headingId}
          className="grid snap-x snap-mandatory auto-cols-[calc((100%-(var(--columns)-1)*var(--card-gap))/var(--columns))] grid-flow-col gap-[var(--card-gap)] overflow-x-auto scroll-px-1.5 px-1.5 py-2 [--card-gap:1rem] [--columns:2] [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#244432] motion-safe:scroll-smooth sm:[--columns:3] md:[--columns:4] min-[896px]:[--columns:5] min-[960px]:[--columns:7] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product, index) => (
            <li key={`${product.id}-${index}`} className="min-w-0 snap-start">
              <HomeProductCard product={product} />
            </li>
          ))}
        </ul>

        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollRow(1)}
            disabled={!canScrollRight}
            aria-label={`Next products from ${orgName}`}
            className={`${arrowClass} -right-2`}
          >
            <ChevronRight aria-hidden="true" size={20} strokeWidth={3} />
          </button>
        )}
      </div>
    </section>
  );
}

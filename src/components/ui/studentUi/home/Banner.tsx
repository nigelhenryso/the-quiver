"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BannerProps = {
  slides: string[]; // placeholder text for now, swap for images later
  label: string; // for screen readers
};

// full width green banner with arrows + dots (promo and featured orgs)
export default function Banner({ slides, label }: BannerProps) {
  const [current, setCurrent] = useState(0);

  // arrows stop at the first / last slide
  const canGoPrev = current > 0;
  const canGoNext = current < slides.length - 1;

  const prev = () => setCurrent((c) => Math.max(c - 1, 0));
  const next = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));

  const hasMultipleSlides = slides.length > 1; // single slide = no arrows or dots

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative h-[clamp(220px,30vw,430px)] w-full overflow-hidden bg-[#BBEE8A] shadow-[0px_3px_4px_rgba(0,0,0,0.25)]"
    >
      {/* slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((text, index) => (
          <div
            key={index}
            className="flex h-full w-full flex-none items-center justify-center px-16"
          >
            <p className={`font-heading text-center text-[20px] text-[#3D5A45]`}>{text}</p>
          </div>
        ))}
      </div>

      {hasMultipleSlides && (
        <>
          {/* arrows: dark = there is more to see, light = nothing more that way */}
          <button
            type="button"
            onClick={prev}
            disabled={!canGoPrev}
            aria-label="Previous slide"
            className={`absolute left-3 top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors ${
              canGoPrev
                ? "cursor-pointer bg-[#244A36] hover:bg-[#3C7657]"
                : "cursor-default bg-[#6E9C77]/60"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canGoNext}
            aria-label="Next slide"
            className={`absolute right-3 top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors ${
              canGoNext
                ? "cursor-pointer bg-[#244A36] hover:bg-[#3C7657]"
                : "cursor-default bg-[#6E9C77]/60"
            }`}
          >
            <ChevronRight size={16} />
          </button>

          {/* dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === current}
                className={`h-[5px] w-[5px] cursor-pointer rounded-full transition-colors ${
                  index === current ? "bg-[#3D5A45]" : "bg-[#3D5A45]/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
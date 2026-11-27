"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { ProductMedia } from "@/src/types/ProductDetails";

const arrowClass =
  "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-[#244432]/90 text-white shadow-md transition hover:bg-[#356049] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244432] disabled:opacity-30";

/** Swipeable product photos + video. `focusUrl` jumps to that slide (used for variant photos). */
export default function MediaCarousel({ media, name, focusUrl }: { media: ProductMedia[]; name: string; focusUrl?: string | null }) {
  const [index, setIndex] = useState(0);
  const videos = useRef(new Map<number, HTMLVideoElement>());
  const touchStart = useRef<number | null>(null);
  const count = media.length;
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Index into `media` of the photo shown enlarged, or null when closed.
  const [zoomed, setZoomed] = useState<number | null>(null);
  const photoSlides = media.flatMap((item, slide) => (item.kind === "image" ? [slide] : []));

  useEffect(() => {
    if (!focusUrl) return;
    const target = media.findIndex((item) => item.url === focusUrl);
    if (target !== -1) setIndex(target);
  }, [focusUrl, media]);

  // Pause any video that slides out of view.
  useEffect(() => {
    videos.current.forEach((video, slide) => {
      if (slide !== index) video.pause();
    });
  }, [index]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (zoomed !== null && !dialog.open) dialog.showModal();
    if (zoomed === null && dialog.open) dialog.close();
  }, [zoomed]);

  const zoomStep = (direction: -1 | 1) => {
    if (zoomed === null) return;
    const next = photoSlides[photoSlides.indexOf(zoomed) + direction];
    if (next !== undefined) {
      setZoomed(next);
      setIndex(next);
    }
  };
  const zoomPosition = zoomed === null ? -1 : photoSlides.indexOf(zoomed);

  const go = (next: number) => setIndex(Math.max(0, Math.min(count - 1, next)));

  if (count === 0) {
    return <div aria-label="No photos yet" role="img" className="aspect-[4/5] w-full rounded-md bg-[#B9D9A8]" />;
  }

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-md border-[3px] border-[#B9D9A8] bg-[#B9D9A8]"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} photos and video`}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(index - 1);
          if (event.key === "ArrowRight") go(index + 1);
        }}
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(distance) > 40) go(index + (distance < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {media.map((item, slide) => (
            <div
              key={`${item.url}-${slide}`}
              className="aspect-[4/5] w-full flex-[0_0_100%] overflow-hidden rounded-[3px]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${slide + 1} of ${count}`}
              aria-hidden={slide !== index}
            >
              {item.kind === "video" ? (
                <video
                  ref={(element) => {
                    if (element) videos.current.set(slide, element);
                    else videos.current.delete(slide);
                  }}
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  tabIndex={slide === index ? 0 : -1}
                  className="size-full bg-black object-contain"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setZoomed(slide)}
                  tabIndex={slide === index ? 0 : -1}
                  aria-label={`Enlarge photo ${slide + 1}`}
                  className="block size-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={slide === 0 ? name : ""}
                    loading={slide === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="size-full object-cover"
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous photo" className={`${arrowClass} left-2`}>
              <ChevronLeft aria-hidden="true" size={20} strokeWidth={3} />
            </button>
            <button type="button" onClick={() => go(index + 1)} disabled={index === count - 1} aria-label="Next photo" className={`${arrowClass} right-2`}>
              <ChevronRight aria-hidden="true" size={20} strokeWidth={3} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Choose a photo">
          {media.map((item, slide) => (
            <li key={`${item.url}-thumb-${slide}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(slide)}
                aria-label={`Show ${item.kind === "video" ? "video" : `photo ${slide + 1}`}`}
                aria-current={slide === index}
                className={`relative block size-14 overflow-hidden rounded-md border-2 bg-[#B9D8A6] transition ${slide === index ? "border-[#1C9C6E]" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {item.kind === "video" ? (
                  <span className="grid size-full place-items-center bg-[#244432] text-white">
                    <Play aria-hidden="true" size={18} fill="currentColor" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`${name} photo`}
        onClose={() => setZoomed(null)}
        onClick={(event) => {
          // Clicking the dark backdrop (not the photo or buttons) closes it.
          if (event.target === event.currentTarget) setZoomed(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") zoomStep(-1);
          if (event.key === "ArrowRight") zoomStep(1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/80 open:flex open:items-center open:justify-center"
      >
        {zoomed !== null && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media[zoomed].url}
              alt={name}
              className="max-h-[85dvh] max-w-[90vw] rounded-md object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomed(null)}
              aria-label="Close"
              autoFocus
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X aria-hidden="true" size={22} />
            </button>
            {photoSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => zoomStep(-1)}
                  disabled={zoomPosition <= 0}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ChevronLeft aria-hidden="true" size={24} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => zoomStep(1)}
                  disabled={zoomPosition >= photoSlides.length - 1}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ChevronRight aria-hidden="true" size={24} strokeWidth={3} />
                </button>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 font-body text-xs text-white">
                  {zoomPosition + 1} / {photoSlides.length}
                </p>
              </>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}

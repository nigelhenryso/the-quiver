"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

export default function PageScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const geometry = useRef({ maxScroll: 0, travel: 0 });
  const drag = useRef<{ pointerId: number; y: number; scrollTop: number } | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const root = document.documentElement;
    const scroller = document.scrollingElement;
    if (!track || !thumb || !scroller) return;

    const forcedColors = window.matchMedia("(forced-colors: active)");

    function updatePosition() {
      if (!thumb || !scroller) return;
      const { maxScroll, travel } = geometry.current;
      if (maxScroll <= 0) return;

      const progress = Math.max(0, Math.min(1, scroller.scrollTop / maxScroll));
      thumb.style.transform = `translateY(${progress * travel}px)`;
      const percent = String(Math.round(progress * 100));
      if (thumb.getAttribute("aria-valuenow") !== percent) thumb.setAttribute("aria-valuenow", percent);
    }

    function updateGeometry() {
      if (!track || !thumb || !scroller) return;
      root.toggleAttribute("data-page-scrollbar", !forcedColors.matches);
      const trackHeight = track.clientHeight;
      const viewportHeight = scroller.clientHeight;
      const maxScroll = scroller.scrollHeight - viewportHeight;
      const locked = [root, document.body].some((element) => {
        const overflow = getComputedStyle(element).overflowY;
        return overflow === "hidden" || overflow === "clip";
      });
      const visible = !forcedColors.matches && !locked && maxScroll > 0 && trackHeight > 0;
      thumb.hidden = !visible;

      if (!visible) {
        geometry.current = { maxScroll: 0, travel: 0 };
        drag.current = null;
        return;
      }

      const height = Math.min(trackHeight, Math.max(32, trackHeight * viewportHeight / scroller.scrollHeight));
      thumb.style.height = `${height}px`;
      geometry.current = { maxScroll, travel: trackHeight - height };
      updatePosition();
    }

    updateGeometry();
    const resizeObserver = new ResizeObserver(updateGeometry);
    resizeObserver.observe(root);
    resizeObserver.observe(document.body);
    const lockObserver = new MutationObserver(updateGeometry);
    const lockAttributes = { attributeFilter: ["class", "style"] };
    lockObserver.observe(root, lockAttributes);
    lockObserver.observe(document.body, lockAttributes);
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updateGeometry);
    forcedColors.addEventListener("change", updateGeometry);

    return () => {
      root.removeAttribute("data-page-scrollbar");
      resizeObserver.disconnect();
      lockObserver.disconnect();
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updateGeometry);
      forcedColors.removeEventListener("change", updateGeometry);
    };
  }, []);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || geometry.current.travel <= 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, y: event.clientY, scrollTop: window.scrollY };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const { travel, maxScroll } = geometry.current;
    if (!start || start.pointerId !== event.pointerId || travel <= 0) return;

    const top = start.scrollTop + (event.clientY - start.y) * maxScroll / travel;
    window.scrollTo({ top, behavior: "instant" });
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function scrollByKey(event: KeyboardEvent<HTMLDivElement>) {
    const position = window.scrollY;
    const page = document.documentElement.clientHeight;
    const offsets: Record<string, number> = {
      ArrowUp: position - 40,
      ArrowDown: position + 40,
      PageUp: position - page,
      PageDown: position + page,
      Home: 0,
      End: geometry.current.maxScroll,
    };
    const top = offsets[event.key];
    if (typeof top !== "number") return;

    event.preventDefault();
    window.scrollTo({ top, behavior: "instant" });
  }

  return (
    <div ref={trackRef} className="pointer-events-none fixed inset-y-0 end-0 z-40 w-3 print:hidden">
      <div
        ref={thumbRef}
        hidden
        role="scrollbar"
        aria-label="Page scroll"
        aria-controls="page-scroll-root"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={scrollByKey}
        className="pointer-events-auto absolute inset-x-0 top-0 cursor-grab touch-none select-none rounded-full active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#008A58]"
      >
        <span aria-hidden className="pointer-events-none absolute inset-y-0 end-0.5 w-[5px] rounded-full bg-[var(--scrollbar-thumb)]" />
      </div>
    </div>
  );
}

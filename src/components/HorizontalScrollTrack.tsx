"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

// Wraps a horizontally-scrollable row with a custom scroll-position bar
// underneath (native mobile scrollbars are hidden/invisible, so there's
// otherwise no visual cue that a row scrolls or how far you are into it),
// plus a pair of faded arrow buttons on desktop/tablet-width windows where
// there's no touch swipe to fall back on and the row's scrollability isn't
// obvious at a glance.
export function HorizontalScrollTrack({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ widthPct: 100, leftPct: 0 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateThumb() {
    const el = trackRef.current;
    if (!el) return;
    const widthPct = Math.min(100, (el.clientWidth / el.scrollWidth) * 100);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const leftPct = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - widthPct) : 0;
    setThumb({ widthPct, leftPct });
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  }

  // Compute the initial thumb size on mount/resize — onScroll alone never
  // fires until the user first scrolls, so the bar would stay hidden (100%
  // width looks like "nothing to scroll") until then otherwise.
  useEffect(() => {
    updateThumb();
    window.addEventListener("resize", updateThumb);
    return () => window.removeEventListener("resize", updateThumb);
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    // Snapping to an arbitrary (non-card-aligned) offset fights the row's
    // scroll-snap-mandatory and can cancel the smooth scroll partway,
    // snapping straight back to the start — so this rounds the distance to
    // a whole number of cards (using the first child's width as the step)
    // instead of a flat percentage of the viewport.
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 /* gap-4 */ : el.clientWidth;
    const cardsPerView = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: direction * cardsPerView * step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateThumb}
        className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-14 items-center bg-gradient-to-r from-paper to-transparent pb-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Xem sản phẩm trước"
            className="pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-paper text-ink shadow-md transition-colors hover:bg-forest hover:text-paper"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-14 items-center justify-end bg-gradient-to-l from-paper to-transparent pb-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Xem thêm sản phẩm"
            className="pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-paper text-ink shadow-md transition-colors hover:bg-forest hover:text-paper"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {thumb.widthPct < 100 && (
        <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-kraft-dark/40">
          <div
            className="absolute inset-y-0 rounded-full bg-forest"
            style={{ width: `${thumb.widthPct}%`, left: `${thumb.leftPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

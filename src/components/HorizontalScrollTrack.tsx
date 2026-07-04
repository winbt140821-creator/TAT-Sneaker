"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Wraps a horizontally-scrollable row with a custom scroll-position bar
// underneath (native mobile scrollbars are hidden/invisible, so there's
// otherwise no visual cue that a row scrolls or how far you are into it).
export function HorizontalScrollTrack({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ widthPct: 100, leftPct: 0 });

  function updateThumb() {
    const el = trackRef.current;
    if (!el) return;
    const widthPct = Math.min(100, (el.clientWidth / el.scrollWidth) * 100);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const leftPct = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - widthPct) : 0;
    setThumb({ widthPct, leftPct });
  }

  // Compute the initial thumb size on mount/resize — onScroll alone never
  // fires until the user first scrolls, so the bar would stay hidden (100%
  // width looks like "nothing to scroll") until then otherwise.
  useEffect(() => {
    updateThumb();
    window.addEventListener("resize", updateThumb);
    return () => window.removeEventListener("resize", updateThumb);
  }, []);

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={updateThumb}
        className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
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

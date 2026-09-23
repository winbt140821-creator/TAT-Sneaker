"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Opens a large photo upward the first time it scrolls into view (styles:
// .reveal-* in globals.css). Only ever applied to photos that start below
// the fold, only once, and only after JavaScript has run — so the page is
// fully visible without it, and nothing already on screen ever blinks.
// Meant for editorial photos (covers, category tiles), not product grids.
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.classList.add("reveal-pending");
    let done = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        el.classList.add("reveal-in");
        el.classList.remove("reveal-pending");
        // Hand the photo back to its own hover styles once it's open.
        done = window.setTimeout(() => el.classList.remove("reveal-in"), 1400);
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(done);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

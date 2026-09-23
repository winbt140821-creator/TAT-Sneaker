"use client";

import { useEffect, useRef } from "react";

// Slides the sticky site header away while the shopper reads down the page,
// and brings it back as soon as they scroll up — more of a phone screen for
// photos, without ever making the menu or bag hard to reach. Renders
// nothing itself: it drives the `data-away` attribute on its <header>
// (styled by .site-header in globals.css).
//
// Stays put near the top of the page, while anything inside the header has
// keyboard focus, and while a menu/search panel inside it is open.
const TOP_ZONE = 120;
const HIDE_AFTER = 40;
const SHOW_AFTER = 16;

export function HeaderAutoHide() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = marker.current?.closest("header");
    if (!header) return;

    let lastY = window.scrollY;
    let turnY = lastY;
    let direction = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const d = Math.sign(y - lastY);
      if (d !== 0 && d !== direction) {
        direction = d;
        turnY = lastY;
      }
      lastY = y;

      const pinned =
        y < TOP_ZONE ||
        header.contains(document.activeElement) ||
        // An open menu drawer is position:fixed inside the header — moving
        // the header would drag the drawer with it.
        header.querySelector("[aria-expanded='true'], [role='dialog']") !== null;
      if (pinned || (direction < 0 && turnY - y > SHOW_AFTER)) header.dataset.away = "false";
      else if (direction > 0 && y - turnY > HIDE_AFTER) header.dataset.away = "true";
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocus = () => (header.dataset.away = "false");

    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", onFocus);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={marker} hidden />;
}

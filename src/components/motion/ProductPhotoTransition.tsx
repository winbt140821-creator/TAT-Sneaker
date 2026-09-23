"use client";

import { useEffect } from "react";

// When a product card is tapped, its photo becomes the product page's main
// photo instead of the page just crossfading: the tapped card's
// [data-product-photo] element gets view-transition-name "product-photo"
// right before navigating, and the product page's first photo carries the
// same name (see the galleries). The browser then animates one into the
// other within the page transition React already runs (the <ViewTransition>
// in src/app/[locale]/layout.tsx).
//
// Named on tap rather than on every card because a name must be unique on
// the page, and the same product can appear in two homepage sections.
// Browsers without View Transitions simply navigate as before.
export function ProductPhotoTransition() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest?.("a[href]");
      const photo = link?.querySelector<HTMLElement>("[data-product-photo]");
      document.querySelectorAll<HTMLElement>("[data-product-photo]").forEach((el) => {
        if (el !== photo) el.style.viewTransitionName = "";
      });
      if (photo) photo.style.viewTransitionName = "product-photo";
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

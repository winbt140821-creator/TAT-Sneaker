"use client";

import { useEffect } from "react";

// The last product photo tapped in a grid — read by the product page's
// loading screen (san-pham/[id]/ProductPageSkeleton) so the photo the
// shopper just touched is already on screen while the page itself loads.
export const lastTappedProduct: { path: string | null; src: string | null; name: string } = {
  path: null,
  src: null,
  name: "",
};

// When a product card is tapped, its photo becomes the product page's main
// photo instead of the page just crossfading: the tapped card's
// [data-product-photo] element gets view-transition-name "product-photo"
// right before navigating, and the product page's first photo (and its
// loading screen) carries the same name. The browser then animates one into
// the other within the page transition React already runs (the
// <ViewTransition> in src/app/[locale]/layout.tsx).
//
// Named on tap rather than on every card because a name must be unique on
// the page, and the same product can appear in two homepage sections.
// Browsers without View Transitions simply navigate as before.
export function ProductPhotoTransition() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest?.<HTMLAnchorElement>("a[href]");
      const photo = link?.querySelector<HTMLElement>("[data-product-photo]");
      document.querySelectorAll<HTMLElement>("[data-product-photo]").forEach((el) => {
        if (el !== photo) el.style.viewTransitionName = "";
      });
      if (!link || !photo) return;
      photo.style.viewTransitionName = "product-photo";
      const img = photo.querySelector("img");
      lastTappedProduct.path = new URL(link.href).pathname;
      lastTappedProduct.src = img?.currentSrc || img?.src || null;
      lastTappedProduct.name = img?.alt ?? "";
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

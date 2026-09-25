"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { lastTappedProduct } from "@/components/motion/ProductPhotoTransition";
import type { Department } from "@/lib/inventory";

// What a product page shows the instant it's tapped, while the real page is
// still on its way from the server (loading.tsx). Laid out like the real
// page for each store, so nothing jumps when it arrives — and if the tap
// came from a product card, that card's photo is already in the photo slot
// (carrying the same view-transition name, so it flies straight there).
// Before this, a tap on a phone did nothing visible for up to a second,
// which is what made shoppers tap a product several times.
export function ProductPageSkeleton({ department }: { department: Department }) {
  // Only trust the stored photo if it belongs to the product being opened
  // (search suggestions or links elsewhere don't set it). Matched on the
  // route's id rather than the address bar, which may not have switched to
  // the new URL yet when this first renders.
  const { id } = useParams<{ id: string }>();
  const [photo] = useState(() =>
    lastTappedProduct.path?.endsWith(`/san-pham/${id}`) ? { ...lastTappedProduct } : null
  );

  const image = photo?.src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.src}
      alt={photo.name}
      // Matches the page it turns into: clothing photos are shown whole.
      className={`absolute inset-0 h-full w-full ${department === "CLOTHING" ? "object-contain" : "object-cover"}`}
    />
  ) : null;
  const bar = "animate-pulse bg-kraft-dark/60 motion-reduce:animate-none";

  if (department === "CLOTHING") {
    return (
      <div aria-busy="true" className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="relative aspect-[4/5] bg-kraft lg:aspect-auto lg:min-h-[calc(100svh-60px)]" style={{ viewTransitionName: "product-photo" }}>
          {image}
        </div>
        <div className="flex flex-col gap-3 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <div className={`h-3 w-32 ${bar}`} />
          {photo?.name ? (
            <p className="mt-2 font-body text-xl leading-snug text-ink">{photo.name}</p>
          ) : (
            <div className={`mt-2 h-6 w-3/4 ${bar}`} />
          )}
          <div className={`h-4 w-24 ${bar}`} />
          <div className="mt-6 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`h-11 ${bar}`} />
            ))}
          </div>
          <div className={`mt-4 h-12 ${bar}`} />
        </div>
      </div>
    );
  }

  return (
    <div aria-busy="true" className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6">
      <div className={`mb-4 h-3 w-40 ${bar}`} />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div
          className="die-cut relative aspect-square overflow-hidden bg-kraft-dark/30"
          style={{ viewTransitionName: "product-photo" }}
        >
          {image}
        </div>
        <div className="flex flex-col gap-3">
          {photo?.name ? (
            <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">{photo.name}</p>
          ) : (
            <div className={`h-8 w-3/4 ${bar}`} />
          )}
          <div className={`h-4 w-28 ${bar}`} />
          <div className={`h-7 w-40 ${bar}`} />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`h-10 w-10 ${bar}`} />
            ))}
          </div>
          <div className={`mt-4 h-11 w-full sm:w-72 ${bar}`} />
        </div>
      </div>
    </div>
  );
}

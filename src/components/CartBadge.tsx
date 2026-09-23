"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cartCount, getCartSnapshot, getServerCartSnapshot, subscribeCart } from "@/lib/cart-storage";

export function CartBadge() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const count = cartCount(items);

  // Pops the number (.cart-bump in globals.css) each time something is
  // added, so an add-to-cart visibly lands in the bag. Driven by the cart's
  // own change events rather than by `count`, which also jumps from 0 to
  // the saved total right after hydration — that must not pop.
  const [bumps, setBumps] = useState(0);
  useEffect(() => {
    let last = cartCount(getCartSnapshot());
    return subscribeCart(() => {
      const next = cartCount(getCartSnapshot());
      if (next > last) setBumps((b) => b + 1);
      last = next;
    });
  }, []);

  if (count === 0) return null;

  return (
    <span
      key={bumps}
      className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-stamp px-1 font-mono text-[9px] font-semibold leading-none text-paper ring-2 ring-paper ${bumps ? "cart-bump" : ""}`}
    >
      {count}
    </span>
  );
}

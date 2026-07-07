"use client";

import { useSyncExternalStore } from "react";
import { cartCount, getCartSnapshot, getServerCartSnapshot, subscribeCart } from "@/lib/cart-storage";

export function CartBadge() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const count = cartCount(items);

  if (count === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-stamp px-1 font-mono text-[9px] font-semibold leading-none text-paper ring-2 ring-paper">
      {count}
    </span>
  );
}

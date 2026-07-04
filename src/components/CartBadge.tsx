"use client";

import { useSyncExternalStore } from "react";
import { cartCount, getCartSnapshot, getServerCartSnapshot, subscribeCart } from "@/lib/cart-storage";

export function CartBadge() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);

  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stamp px-1 font-mono text-[9px] font-semibold leading-none text-paper">
      {cartCount(items)}
    </span>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import {
  getServerWishlistSnapshot,
  getWishlistSnapshot,
  subscribeWishlist,
} from "@/lib/wishlist-storage";

export function WishlistBadge() {
  const items = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot
  );

  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stamp px-1 font-mono text-[9px] font-semibold leading-none text-paper">
      {items.length}
    </span>
  );
}

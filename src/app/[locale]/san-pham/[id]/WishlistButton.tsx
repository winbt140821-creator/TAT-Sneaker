"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  getServerWishlistSnapshot,
  getWishlistSnapshot,
  subscribeWishlist,
  toggleWishlist,
} from "@/lib/wishlist-storage";
import { HeartIcon } from "@/components/icons";

export function WishlistButton({ productId }: { productId: string }) {
  const t = useTranslations("productActions");
  const items = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot
  );
  const active = items.includes(productId);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={active}
      aria-label={active ? t("wishlistRemove") : t("wishlistAdd")}
      className={
        "die-cut-flat flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border transition-colors " +
        (active
          ? "border-stamp text-stamp"
          : "border-kraft-dark text-graphite hover:border-stamp hover:text-stamp")
      }
    >
      <HeartIcon className="h-5 w-5" filled={active} />
    </button>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  getServerWishlistSnapshot,
  getWishlistSnapshot,
  subscribeWishlist,
  removeFromWishlist,
} from "@/lib/wishlist-storage";
import { formatPriceForLocale } from "@/lib/currency";
import { HeartIcon } from "@/components/icons";
import { SneakerArt, silhouetteFor } from "@/components/SneakerArt";
import { Skeleton } from "@/components/Skeleton";
import { getWishlistProductsAction } from "./actions";
import type { CatalogProduct } from "@/lib/catalog";
import { getDiscountPct } from "@/lib/pricing";
import { hasAnyStock, hasRealStockAnywhere } from "@/lib/inventory";

export function WishlistView({
  usdExchangeRate,
  cnyExchangeRate,
}: {
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
}) {
  const locale = useLocale();
  const formatPrice = (vnd: number) =>
    formatPriceForLocale(vnd, locale, { usdExchangeRate, cnyExchangeRate });
  const t = useTranslations("wishlist");
  const tCommon = useTranslations("common");
  const tDetail = useTranslations("productDetail");
  const ids = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot
  );
  const [products, setProducts] = useState<Record<string, CatalogProduct>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const idsKey = [...ids].sort().join(",");
  const loading = loadedKey !== idsKey;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const found = await getWishlistProductsAction(idsKey ? idsKey.split(",") : []);
      if (cancelled) return;
      setProducts(Object.fromEntries(found.map((p) => [p.id, p])));
      setLoadedKey(idsKey);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="die-cut flex flex-col gap-2 bg-paper p-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = ids.map((id) => products[id]).filter((p): p is CatalogProduct => Boolean(p));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="font-mono text-sm text-graphite">{t("empty")}</p>
        <Link
          href="/"
          className="die-cut-flat mt-4 inline-block cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          {tCommon("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product, i) => {
          const discountPct = getDiscountPct(product.price, product.originalPrice);
          const inStock =
            product.availability === "PREORDER"
              ? hasRealStockAnywhere(product.sizeQuantities)
              : hasAnyStock(product.sizeQuantities);

          return (
            <div key={product.id} className="die-cut hover-lift group flex flex-col bg-paper">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-kraft-dark/30 p-4">
                <Link href={`/san-pham/${product.id}`} className="absolute inset-0">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      quality={90}
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <SneakerArt
                      silhouette={silhouetteFor(i)}
                      accent={product.accent}
                      className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </Link>

                {discountPct && (
                  <span className="pointer-events-none absolute left-2 top-2 bg-forest px-2 py-0.5 font-mono text-[10px] font-semibold text-paper">
                    -{discountPct}%
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.id)}
                  aria-label="Bỏ khỏi yêu thích"
                  className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-paper text-stamp shadow transition-colors hover:bg-stamp hover:text-paper"
                >
                  <HeartIcon className="h-4 w-4" filled />
                </button>
              </div>

              <Link href={`/san-pham/${product.id}`} className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="font-body text-sm font-medium leading-snug text-ink">
                  {product.name}
                </h3>
                <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-forest">
                  {product.quality}
                </p>
                <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
                  <p className="font-mono text-lg font-bold text-forest">
                    {formatPrice(product.price)}
                  </p>
                  {product.originalPrice && (
                    <>
                      <p className="font-mono text-xs text-graphite/60 line-through">
                        {formatPrice(product.originalPrice)}
                      </p>
                      <span className="bg-forest px-1.5 py-0.5 font-mono text-[10px] font-bold text-paper">
                        -{discountPct}%
                      </span>
                    </>
                  )}
                </div>
                <p className="font-mono text-[11px] text-graphite">
                  {inStock
                    ? tDetail("inStock")
                    : product.availability === "PREORDER"
                      ? tDetail("leadTime", { min: product.leadTimeMinDays, max: product.leadTimeMaxDays })
                      : tDetail("outOfStock")}
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  removeFromCart,
  subscribeCart,
  updateCartQuantity,
} from "@/lib/cart-storage";
import { formatPriceForLocale } from "@/lib/currency";
import { getQuantityForSize } from "@/lib/inventory";
import { Skeleton } from "@/components/Skeleton";
import { QuantityStepper } from "@/components/QuantityStepper";
import { getCartProductsAction } from "./actions";

type CartProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  images: string[];
  sizeQuantities: Record<string, number>;
  depositRequired: boolean;
  depositAmount: number | null;
  availability: "IN_STOCK" | "PREORDER";
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
};

export function CartView({
  usdExchangeRate,
  cnyExchangeRate,
}: {
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
}) {
  const locale = useLocale();
  const formatPrice = (vnd: number) =>
    formatPriceForLocale(vnd, locale, { usdExchangeRate, cnyExchangeRate });
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tActions = useTranslations("productActions");
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const idsKey = [...new Set(items.map((i) => i.productId))].sort().join(",");
  const loading = loadedKey !== idsKey;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const ids = idsKey ? idsKey.split(",") : [];
      const found = await getCartProductsAction(ids);
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="die-cut flex items-center gap-4 bg-paper p-3">
              <Skeleton className="h-16 w-16 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-7 w-20 shrink-0" />
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  const rows = items.map((item) => {
    const product = products[item.productId];
    const soldOut = product ? getQuantityForSize(product.sizeQuantities, item.size) <= 0 : false;
    return { item, product, soldOut };
  });

  const validRows = rows.filter((r) => r.product && !r.soldOut);
  const total = validRows.reduce((sum, r) => sum + r.product!.price * r.item.quantity, 0);
  const depositTotal = validRows.reduce((sum, r) => {
    const p = r.product!;
    return sum + (p.depositRequired ? (p.depositAmount ?? 0) : 0) * r.item.quantity;
  }, 0);
  const hasInvalid = rows.some((r) => !r.product || r.soldOut);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>

      <div className="mt-6 flex flex-col gap-3">
        {rows.map(({ item, product, soldOut }) => (
          <div
            key={`${item.productId}-${item.size}`}
            className="die-cut flex flex-wrap items-center gap-4 bg-paper p-3"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-kraft-dark/30">
              {product?.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-mono text-[9px] text-graphite">Ảnh</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm font-medium text-ink">
                {product?.name ?? "Sản phẩm không còn tồn tại"}
              </p>
              <p className="font-mono text-xs text-graphite">Size {item.size}</p>
              {soldOut && (
                <p className="font-mono text-xs font-semibold text-stamp">
                  Size này vừa hết hàng
                </p>
              )}
              {product && !soldOut && product.availability === "PREORDER" && (
                <p className="font-mono text-[11px] text-graphite">
                  Đặt trước · giao {product.leadTimeMinDays}-{product.leadTimeMaxDays} ngày
                </p>
              )}
              {product && !soldOut && product.depositRequired && (
                <p className="font-mono text-[11px] text-forest">
                  Cần đặt cọc {formatPrice(product.depositAmount ?? 0)}/sản phẩm
                </p>
              )}
            </div>

            {product && !soldOut && (
              <>
                <div className="shrink-0">
                  <QuantityStepper
                    quantity={item.quantity}
                    decreaseLabel={tActions("decreaseQty")}
                    increaseLabel={tActions("increaseQty")}
                    onDecrease={() => updateCartQuantity(item.productId, item.size, item.quantity - 1)}
                    onIncrease={() => updateCartQuantity(item.productId, item.size, item.quantity + 1)}
                  />
                </div>
                <p className="w-28 shrink-0 text-right font-mono text-sm font-semibold text-forest">
                  {formatPrice(product.price * item.quantity)}
                </p>
              </>
            )}

            <button
              type="button"
              onClick={() => removeFromCart(item.productId, item.size)}
              className="shrink-0 cursor-pointer font-mono text-xs uppercase tracking-wide text-graphite hover:text-stamp hover:underline"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>

      <div className="die-cut mt-6 flex flex-col items-end gap-3 bg-paper p-5">
        {hasInvalid && (
          <p className="font-mono text-xs text-stamp">
            Một số sản phẩm đã hết hàng và sẽ không được tính vào đơn — hãy xóa để tiếp tục.
          </p>
        )}
        <p className="font-mono text-sm text-graphite">
          Tổng cộng: <span className="text-lg font-semibold text-forest">{formatPrice(total)}</span>
        </p>
        {depositTotal > 0 && (
          <p className="font-mono text-xs text-graphite">
            Trong đó tiền cọc: <span className="font-semibold text-ink">{formatPrice(depositTotal)}</span>
          </p>
        )}
        {validRows.length > 0 ? (
          <Link
            href="/thanh-toan"
            className="die-cut-flat cursor-pointer bg-forest px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-forest-dark"
          >
            {t("checkout")}
          </Link>
        ) : (
          <p className="font-mono text-xs text-graphite">
            Không có sản phẩm hợp lệ để đặt hàng.
          </p>
        )}
      </div>
    </div>
  );
}

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPriceForCurrentLocale } from "@/lib/currency.server";
import type { CatalogProduct } from "@/lib/catalog";
import { getDiscountPct } from "@/lib/pricing";
import { hasAnyStock, hasRealStockAnywhere } from "@/lib/inventory";
import { SneakerArt, silhouetteFor } from "./SneakerArt";

export async function ProductCard({
  product,
  index,
}: {
  product: CatalogProduct;
  index: number;
}) {
  const [t, tDetail, price, originalPrice] = await Promise.all([
    getTranslations("product"),
    getTranslations("productDetail"),
    formatPriceForCurrentLocale(product.price),
    product.originalPrice ? formatPriceForCurrentLocale(product.originalPrice) : Promise.resolve(null),
  ]);
  const discountPct = getDiscountPct(product.price, product.originalPrice);
  // A preorder-flagged product still shows as a normal in-stock item once
  // any size has been given real ready stock (see hasRealStockForSize) —
  // the "Đặt trước" framing only makes sense while nothing is on hand yet.
  const inStock =
    product.availability === "PREORDER"
      ? hasRealStockAnywhere(product.sizeQuantities)
      : hasAnyStock(product.sizeQuantities);
  const showPreorderBadge = product.availability === "PREORDER" && !inStock;

  return (
    <Link
      href={`/san-pham/${product.id}`}
      className="die-cut hover-lift group flex flex-col bg-paper"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-kraft-dark/30 p-4">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <SneakerArt
            silhouette={silhouetteFor(index)}
            accent={product.accent}
            className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        )}

        {discountPct && (
          <span className="absolute left-2 top-2 bg-forest px-2 py-0.5 font-mono text-[10px] font-semibold text-paper">
            -{discountPct}%
          </span>
        )}

        {showPreorderBadge && (
          <span className="absolute right-2 top-2 bg-stamp px-2 py-0.5 font-mono text-[10px] font-semibold text-paper">
            {t("preorder")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-body text-sm font-medium leading-snug text-ink">
          {product.name}
        </h3>
        <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-forest">
          {product.quality}
        </p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          <p className="font-mono text-lg font-bold text-forest">{price}</p>
          {originalPrice && (
            <>
              <p className="font-mono text-xs text-graphite/60 line-through">{originalPrice}</p>
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
      </div>
    </Link>
  );
}

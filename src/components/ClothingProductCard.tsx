import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPriceForCurrentLocale } from "@/lib/currency.server";
import type { CatalogProduct } from "@/lib/catalog";
import { getDiscountPct } from "@/lib/pricing";
import { hasAnyStock, hasRealStockAnywhere } from "@/lib/inventory";
import { GarmentArt, garmentSilhouetteFor } from "./GarmentArt";

// Product tile as COS/Zara set it: a tall portrait photo with no frame, no
// card background and no badges shouting over it; the second photo fades
// in on hover; name and price sit underneath in small plain type. The shoe
// site's quality tier ("AUTH"/"Best Quality") is a sneaker-resale concept
// and is left off here entirely.
export async function ClothingProductCard({
  product,
  index,
  priority = false,
}: {
  product: CatalogProduct;
  index: number;
  priority?: boolean;
}) {
  const [tDetail, price, originalPrice] = await Promise.all([
    getTranslations("productDetail"),
    formatPriceForCurrentLocale(product.price),
    product.originalPrice ? formatPriceForCurrentLocale(product.originalPrice) : Promise.resolve(null),
  ]);
  const discountPct = getDiscountPct(product.price, product.originalPrice);
  const inStock =
    product.availability === "PREORDER"
      ? hasRealStockAnywhere(product.sizeQuantities)
      : hasAnyStock(product.sizeQuantities);
  const [img0, img1] = product.images;

  return (
    <Link href={`/san-pham/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-kraft">
        {img0 ? (
          <>
            <Image
              src={img0}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, 50vw"
              quality={90}
              className={
                "object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none " +
                (img1 ? "group-hover:opacity-0" : "")
              }
            />
            {img1 && (
              <Image
                src={img1}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                quality={90}
                className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 motion-reduce:transition-none"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-10">
            <GarmentArt silhouette={garmentSilhouetteFor(index)} accent="#b5b5b5" className="h-full w-full" />
          </div>
        )}

        {!inStock && product.availability !== "PREORDER" && (
          <span className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-[0.14em] text-ink">
            {tDetail("outOfStock")}
          </span>
        )}
      </div>

      <div className="px-3 pb-1 pt-3 sm:px-4">
        <h3 className="font-body text-[13px] leading-snug text-ink">{product.name}</h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-body text-[13px]">
          <span className={discountPct ? "text-stamp" : "text-ink"}>{price}</span>
          {originalPrice && <span className="text-graphite line-through">{originalPrice}</span>}
          {!inStock && product.availability === "PREORDER" && (
            <span className="text-graphite">· {tDetail("preorder")}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { ProductGrid } from "@/components/ProductGrid";
import { Link } from "@/i18n/navigation";
import { getProductById, getRelatedProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { getDiscountPct } from "@/lib/pricing";
import { hasAnyStock, hasRealStockAnywhere } from "@/lib/inventory";
import { formatPrice } from "@/lib/products";
import { formatPriceForCurrentLocale } from "@/lib/currency.server";
import { getYoutubeEmbedUrl } from "@/lib/youtube";
import { getSizeChartForCategory } from "@/lib/size-chart";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { ShieldCheckIcon, RotateIcon, TruckIcon, TagIcon } from "@/components/icons";
import { ProductGallery } from "./ProductGallery";
import { ProductDescription } from "./ProductDescription";
import { ProductActions } from "./ProductActions";
import { SizeGuide } from "./SizeGuide";
import { ProductJsonLd } from "./ProductJsonLd";
import { ViewContentTracker } from "./ViewContentTracker";

function getBrandCategory(product: NonNullable<Awaited<ReturnType<typeof getProductById>>>) {
  return (
    product.categories.find((c) => c.slug !== "Luxury" && c.slug !== "SALE") ??
    product.categories[0]
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return {};

  const brandCategory = getBrandCategory(product);
  const title = brandCategory
    ? `${product.name} - Giày ${brandCategory.label} chính hãng`
    : product.name;
  const description = `${product.name} — ${product.quality}, SKU ${product.sku}, giá ${formatPrice(product.price)}. Đã qua kiểm định 3 bước, giao hàng toàn quốc, thanh toán khi nhận hàng.`;
  const image = product.images[0];
  const path = `/san-pham/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/san-pham/${product.id}`),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const [product, t, tProduct] = await Promise.all([
    getProductById(id),
    getTranslations("productDetail"),
    getTranslations("product"),
  ]);

  if (!product) notFound();

  const brandCategory = getBrandCategory(product);

  const [related, sizeChartRows, price, originalPrice, depositAmount, settings] = await Promise.all([
    getRelatedProducts(product.id, product.categories.map((c) => c.id)),
    getSizeChartForCategory(brandCategory?.id),
    formatPriceForCurrentLocale(product.price),
    product.originalPrice ? formatPriceForCurrentLocale(product.originalPrice) : Promise.resolve(null),
    formatPriceForCurrentLocale(product.depositAmount ?? 0),
    getSiteSettings(),
  ]);

  const description = product.description || settings?.defaultProductDescription;

  const PROMO_ITEMS = [
    { icon: ShieldCheckIcon, text: t("promo1") },
    { icon: TruckIcon, text: t("promo2") },
    { icon: RotateIcon, text: t("promo3") },
    { icon: TagIcon, text: t("promo4") },
  ];

  const discountPct = getDiscountPct(product.price, product.originalPrice);
  const inStock =
    product.availability === "PREORDER"
      ? hasRealStockAnywhere(product.sizeQuantities)
      : hasAnyStock(product.sizeQuantities);

  const videoEmbedUrl = getYoutubeEmbedUrl(product.videoUrl);

  return (
    <>
      <ProductJsonLd product={product} brandLabel={brandCategory?.label} />
      <ViewContentTracker id={product.id} name={product.name} price={product.price} />
      <BreadcrumbJsonLd
        items={[
          ...(brandCategory
            ? [{ name: brandCategory.label, path: `/?category=${encodeURIComponent(brandCategory.slug)}` }]
            : []),
          { name: product.name, path: `/san-pham/${product.id}` },
        ]}
      />
      <Header />
      <main className="flex-1">
        <Breadcrumb
          trail={[
            ...(brandCategory ? [brandCategory.label] : []),
            product.name,
          ]}
        />

        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ProductGallery
              images={product.images}
              name={product.name}
              accent={product.accent}
              fallbackIndex={0}
            />

            <div>
              <h1 className="font-display text-2xl leading-snug text-ink sm:text-3xl">
                {product.name}
              </h1>
              <p className="mt-1 font-mono text-sm font-bold uppercase tracking-wide text-forest">
                {product.quality}
              </p>

              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <p className="font-mono text-3xl font-bold text-forest">{price}</p>
                {originalPrice && (
                  <>
                    <p className="font-mono text-base text-graphite/60 line-through">
                      {originalPrice}
                    </p>
                    <span className="bg-forest px-2 py-0.5 font-mono text-xs font-bold text-paper">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={
                    "px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide " +
                    (inStock ? "bg-forest text-paper" : "bg-stamp text-paper")
                  }
                >
                  {inStock ? t("inStock") : product.availability === "PREORDER" ? t("preorder") : t("outOfStock")}
                </span>
                {!inStock && product.availability === "PREORDER" && (
                  <span className="font-mono text-xs text-graphite">
                    {t("leadTime", { min: product.leadTimeMinDays, max: product.leadTimeMaxDays })}
                  </span>
                )}
              </div>

              {product.depositRequired && (
                <p className="mt-2 font-mono text-xs font-semibold text-stamp">
                  {t("depositRequired", { amount: depositAmount })}
                </p>
              )}

              <div className="die-cut-flat mt-5 flex flex-col gap-2 bg-kraft p-4">
                {PROMO_ITEMS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                    <p className="font-body text-sm text-ink">{text}</p>
                  </div>
                ))}
              </div>

              <SizeGuide rows={sizeChartRows} />

              <ProductActions
                productId={product.id}
                productName={product.name}
                price={product.price}
                sizeQuantities={product.sizeQuantities}
                availability={product.availability}
                leadTimeMinDays={product.leadTimeMinDays}
                leadTimeMaxDays={product.leadTimeMaxDays}
              />

              <div className="mt-6 flex flex-col gap-1 border-t border-kraft-dark pt-4 font-mono text-xs text-graphite">
                <p>
                  {t("quality")} <span className="text-ink">{product.quality}</span>
                </p>
                <p>
                  {t("sku")} <span className="text-ink">{product.sku}</span>
                </p>
                {brandCategory && (
                  <p>
                    {t("brand")}{" "}
                    <Link
                      href={`/?category=${encodeURIComponent(brandCategory.slug)}`}
                      className="text-forest hover:underline"
                    >
                      {brandCategory.label}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {description && <ProductDescription text={description} />}

        {videoEmbedUrl && (
          <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
            <h2 className="border-b border-kraft-dark pb-3 font-display text-xl text-ink">
              {t("video")}
            </h2>
            <div className="die-cut mt-6 aspect-video overflow-hidden">
              <iframe
                src={videoEmbedUrl}
                title={t("videoTitle", { name: product.name })}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center justify-between border-b border-kraft-dark pb-3">
                <h2 className="font-display text-xl text-ink">{t("related")}</h2>
                {brandCategory && (
                  <Link
                    href={`/?category=${encodeURIComponent(brandCategory.slug)}`}
                    className="font-mono text-xs uppercase tracking-wide text-forest hover:underline"
                  >
                    {tProduct("viewAll")}
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-6">
              <ProductGrid products={related} />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

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
import { getDepartment } from "@/lib/department";
import { getDiscountPct } from "@/lib/pricing";
import { hasAnyStock, hasRealStockAnywhere } from "@/lib/inventory";
import { formatPrice } from "@/lib/products";
import { formatPriceForCurrentLocale } from "@/lib/currency.server";
import { getYoutubeEmbedUrl } from "@/lib/youtube";
import { getSizeChartForCategory } from "@/lib/size-chart";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { ShieldCheckIcon, RotateIcon, TruckIcon, TagIcon } from "@/components/icons";
import { ProductGallery } from "./ProductGallery";
import { ClothingGallery } from "./ClothingGallery";
import { CategorySection } from "@/components/CategorySection";
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

// This route reads headers() (via getDepartment(), for the shoe/clothing
// storefront split — see src/lib/department.ts) in both generateMetadata
// and the page component below. That's a dynamic API, which this Next.js
// version treats as a hard build/render error ("DYNAMIC_SERVER_USAGE")
// when combined with any ISR/static caching config on the route — it
// doesn't silently fall back to per-request rendering the way older Next
// versions did. This route previously had `generateStaticParams` returning
// [] plus `export const revalidate = 60` to get ISR-style caching, which
// was fine before department-detection was added but has been hard-500ing
// every single product page ever since (confirmed via Vercel's runtime
// logs: digest "DYNAMIC_SERVER_USAGE" on every /san-pham/[id] request).
// getProductById() below already does a live, uncached DB read on every
// request regardless of this route's caching config, so dropping ISR here
// costs nothing beyond what was already happening — this now renders
// fully dynamically per request, same as the homepage and category pages,
// which already do the identical getDepartment() call safely.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const department = await getDepartment();
  const product = await getProductById(id, department);
  if (!product) return {};

  const brandCategory = getBrandCategory(product);
  const title = brandCategory
    ? department === "CLOTHING"
      ? `${product.name} - ${brandCategory.label} chính hãng`
      : `${product.name} - Giày ${brandCategory.label} chính hãng`
    : product.name;
  const description = `${product.name} — ${product.quality}, SKU ${product.sku}, giá ${formatPrice(product.price)}. Đã qua kiểm định 3 bước, giao hàng toàn quốc, thanh toán khi nhận hàng.`;
  const image = product.images[0];
  const path = `/san-pham/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(path, department) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/san-pham/${product.id}`, department),
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
  const department = await getDepartment();
  const [product, t, tProduct] = await Promise.all([
    getProductById(id, department),
    getTranslations("productDetail"),
    getTranslations("product"),
  ]);

  if (!product) notFound();

  const brandCategory = getBrandCategory(product);

  const [related, sizeChartRows, price, originalPrice, depositAmount, settings] = await Promise.all([
    getRelatedProducts(product.id, product.categories.map((c) => c.id)),
    // Size chart (VN/US/UK/CM shoe conversion) doesn't apply to clothing.
    department === "CLOTHING" ? Promise.resolve([]) : getSizeChartForCategory(brandCategory?.id),
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

  if (department === "CLOTHING") {
    // COS/Zara product page: photographs fill the left of the page edge to
    // edge; a narrow purchase column on the right stays pinned while they
    // scroll. Name and price in small plain type, then size and add-to-bag,
    // then the supporting detail folded into hairline-separated sections
    // instead of an icon box and a separate description band.
    const summaryClass =
      "flex cursor-pointer list-none items-center justify-between py-4 text-[11px] font-medium uppercase tracking-[0.14em] text-ink [&::-webkit-details-marker]:hidden";
    const availabilityText = inStock
      ? t("inStock")
      : product.availability === "PREORDER"
        ? `${t("preorder")} — ${t("leadTime", { min: product.leadTimeMinDays, max: product.leadTimeMaxDays })}`
        : t("outOfStock");

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
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
            <ClothingGallery images={product.images} name={product.name} />

            <div className="px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
              <div className="lg:sticky lg:top-[100px]">
                <nav aria-label="Breadcrumb" className="text-[12px] text-graphite">
                  <Link href="/" className="hover:text-ink">
                    Trang chủ
                  </Link>
                  {brandCategory && (
                    <>
                      {" / "}
                      <Link
                        href={`/?category=${encodeURIComponent(brandCategory.slug)}`}
                        className="hover:text-ink"
                      >
                        {brandCategory.label}
                      </Link>
                    </>
                  )}
                </nav>

                <h1 className="mt-5 font-body text-xl font-normal leading-snug text-ink">{product.name}</h1>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-2 font-body text-[15px]">
                  <span className={discountPct ? "text-stamp" : "text-ink"}>{price}</span>
                  {originalPrice && <span className="text-graphite line-through">{originalPrice}</span>}
                  {discountPct && <span className="text-[12px] text-stamp">-{discountPct}%</span>}
                </p>
                <p className="mt-2 text-[12px] text-graphite">{availabilityText}</p>
                {product.depositRequired && (
                  <p className="mt-1 text-[12px] text-stamp">{t("depositRequired", { amount: depositAmount })}</p>
                )}

                <ProductActions
                  productId={product.id}
                  productName={product.name}
                  price={product.price}
                  sizeQuantities={product.sizeQuantities}
                  availability={product.availability}
                  leadTimeMinDays={product.leadTimeMinDays}
                  leadTimeMaxDays={product.leadTimeMaxDays}
                  department={department}
                />

                <div className="mt-10 border-t border-kraft-dark">
                  {description && (
                    <details className="group border-b border-kraft-dark" open>
                      <summary className={summaryClass}>
                        {t("description")}
                        <span aria-hidden="true" className="text-base font-light group-open:hidden">+</span>
                        <span aria-hidden="true" className="hidden text-base font-light group-open:inline">−</span>
                      </summary>
                      <p className="whitespace-pre-wrap pb-6 font-body text-[13px] leading-relaxed text-ink-soft">
                        {description}
                      </p>
                    </details>
                  )}
                  <details className="group border-b border-kraft-dark">
                    <summary className={summaryClass}>
                      Giao hàng &amp; đổi trả
                      <span aria-hidden="true" className="text-base font-light group-open:hidden">+</span>
                      <span aria-hidden="true" className="hidden text-base font-light group-open:inline">−</span>
                    </summary>
                    <ul className="space-y-2 pb-6 font-body text-[13px] leading-relaxed text-ink-soft">
                      {PROMO_ITEMS.map(({ text }) => (
                        <li key={text}>{text}</li>
                      ))}
                    </ul>
                  </details>
                  <details className="group border-b border-kraft-dark">
                    <summary className={summaryClass}>
                      Thông tin sản phẩm
                      <span aria-hidden="true" className="text-base font-light group-open:hidden">+</span>
                      <span aria-hidden="true" className="hidden text-base font-light group-open:inline">−</span>
                    </summary>
                    <dl className="space-y-1.5 pb-6 font-body text-[13px] text-ink-soft">
                      <div className="flex gap-2">
                        <dt className="text-graphite">{t("sku")}</dt>
                        <dd>{product.sku}</dd>
                      </div>
                      {brandCategory && (
                        <div className="flex gap-2">
                          <dt className="text-graphite">Danh mục:</dt>
                          <dd>{brandCategory.label}</dd>
                        </div>
                      )}
                    </dl>
                  </details>
                </div>
              </div>
            </div>
          </div>

          {videoEmbedUrl && (
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
              <div className="aspect-video overflow-hidden">
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
            <div className="border-t border-kraft-dark">
              <CategorySection heading="Có thể bạn cũng thích" products={related} department={department} />
            </div>
          )}
        </main>
        <Footer />
        <FloatingActions />
      </>
    );
  }

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
                department={department}
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
              <ProductGrid products={related} department={department} />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

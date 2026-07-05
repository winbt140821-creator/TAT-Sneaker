import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { Toolbar } from "@/components/Toolbar";
import { ProductGrid } from "@/components/ProductGrid";
import { CategorySection } from "@/components/CategorySection";
import { CategorySidebar } from "@/components/CategorySidebar";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { NewsSection } from "@/components/NewsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Pagination } from "@/components/Pagination";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import {
  getCategoryBySlug,
  getHomeSections,
  getNavCategories,
  getProducts,
  getShowcaseCategories,
  type ProductSort,
} from "@/lib/catalog";
import { getSiteSettings, heroPropsFromSettings } from "@/lib/settings";
import { languageAlternates } from "@/lib/seo";

type ListingSearchParams = {
  category?: string;
  q?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  availability?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}): Promise<Metadata> {
  const { category, q } = await searchParams;

  if (q) {
    return {
      title: `Kết quả tìm kiếm cho "${q}"`,
      robots: { index: false, follow: true },
    };
  }

  if (category) {
    const activeCategory = await getCategoryBySlug(category);
    if (activeCategory) {
      const path = `/?category=${encodeURIComponent(activeCategory.slug)}`;
      return {
        title: `Giày ${activeCategory.label} chính hãng`,
        description: `Giày ${activeCategory.label} chính hãng, đã qua kiểm định 3 bước. Giao hàng toàn quốc, thanh toán khi nhận hàng.`,
        alternates: { canonical: path, languages: languageAlternates(path) },
      };
    }
  }

  return { alternates: { canonical: "/", languages: languageAlternates("") } };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const { category, q, sort, minPrice, maxPrice, size, availability } = await searchParams;
  const isFiltered = Boolean(
    category || q || sort || minPrice || maxPrice || size || availability
  );

  const [activeCategory, settings, navCategories, t, tCommon, tProduct] = await Promise.all([
    category ? getCategoryBySlug(category) : Promise.resolve(null),
    getSiteSettings(),
    getNavCategories(),
    getTranslations("home"),
    getTranslations("common"),
    getTranslations("product"),
  ]);

  if (isFiltered) {
    const products = await getProducts({
      categorySlug: activeCategory?.slug,
      q,
      sort: sort as ProductSort | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      size: size ? Number(size) : undefined,
      availability: availability as "IN_STOCK" | "PREORDER" | undefined,
    });
    const trail = [
      tCommon("sneakers"),
      ...(activeCategory ? [activeCategory.label] : []),
      ...(q ? [t("searchResultsFor", { query: q })] : []),
    ];
    // Pills for quick-switching between related sub-categories: children
    // when viewing a parent (e.g. "Nike"), or siblings under the same parent
    // when viewing a leaf sub-category (e.g. "Jordan 1 Low" shows every
    // other Air Jordan line).
    const pillCategories = activeCategory
      ? activeCategory.children.length > 0
        ? activeCategory.children
        : (activeCategory.parent?.children ?? [])
      : [];

    return (
      <>
        {activeCategory && (
          <BreadcrumbJsonLd
            items={[{ name: activeCategory.label, path: `/?category=${encodeURIComponent(activeCategory.slug)}` }]}
          />
        )}
        <Header />
        <main className="flex-1">
          <Breadcrumb trail={trail} />
          <div className="mx-auto flex max-w-7xl items-stretch gap-2 px-4 pb-8 pt-2 sm:px-6">
            <CategorySidebar categories={navCategories} activeSlug={activeCategory?.slug} />
            <div className="min-w-0 flex-1">
              <Hero {...heroPropsFromSettings(settings)} />
            </div>
          </div>
          <TrustBar />

          {pillCategories.length > 0 && (
            <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pillCategories.map((p) => (
                  <Link
                    key={p.id}
                    href={`/?category=${encodeURIComponent(p.slug)}`}
                    className={
                      "shrink-0 whitespace-nowrap bg-forest px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-forest-dark " +
                      (p.slug === activeCategory?.slug ? "ring-2 ring-ink ring-offset-1" : "")
                    }
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeCategory && (
            <div className="mx-auto max-w-7xl px-4 pt-6 text-center sm:px-6">
              <h2 className="font-display text-2xl uppercase tracking-wide text-forest sm:text-3xl">
                {activeCategory.label}
              </h2>
            </div>
          )}

          <Toolbar
            from={products.length ? 1 : 0}
            to={products.length}
            total={products.length}
          />
          <ProductGrid products={products} />
          <Pagination current={1} total={50} />
        </main>
        <Footer />
        <FloatingActions />
      </>
    );
  }

  const [{ latest, sections, sale, bestSelling }, showcaseCategories] = await Promise.all([
    getHomeSections(),
    getShowcaseCategories(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[tCommon("sneakers")]} />
        <div className="mx-auto flex max-w-7xl items-stretch gap-2 px-4 pb-8 pt-2 sm:px-6">
          <CategorySidebar categories={navCategories} />
          <div className="min-w-0 flex-1">
            <Hero {...heroPropsFromSettings(settings)} />
          </div>
        </div>
        <TrustBar />

        <CategorySection heading={t("latest")} products={latest} />

        {bestSelling.length > 0 && (
          <CategorySection heading={t("bestSelling")} products={bestSelling} />
        )}

        {sale.length > 0 && (
          <CategorySection
            heading={t("onSale")}
            viewAllHref="/?category=SALE"
            viewAllLabel={tProduct("viewAll")}
            products={sale}
          />
        )}

        {sections.map(({ category: cat, products }) => (
          <CategorySection
            key={cat.id}
            heading={t("brandShoes", { brand: cat.label })}
            viewAllHref={`/?category=${encodeURIComponent(cat.slug)}`}
            viewAllLabel={tProduct("viewAll")}
            pills={cat.children.map((c) => ({ slug: c.slug, label: c.label }))}
            products={products}
          />
        ))}

        <NewsSection />
        <TestimonialsSection />
        <CategoryShowcase categories={showcaseCategories} />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

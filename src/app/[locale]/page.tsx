import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { Toolbar } from "@/components/Toolbar";
import { ProductGrid } from "@/components/ProductGrid";
import { CategorySection } from "@/components/CategorySection";
import { NewsSection } from "@/components/NewsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Pagination } from "@/components/Pagination";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { getCategoryBySlug, getHomeSections, getProducts, type ProductSort } from "@/lib/catalog";
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

  const [activeCategory, settings, t, tCommon, tProduct] = await Promise.all([
    category ? getCategoryBySlug(category) : Promise.resolve(null),
    getSiteSettings(),
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

    return (
      <>
        {activeCategory && (
          <BreadcrumbJsonLd
            items={[{ name: activeCategory.label, path: `/?category=${encodeURIComponent(activeCategory.slug)}` }]}
          />
        )}
        <Header activeCategorySlug={activeCategory?.slug} />
        <main className="flex-1">
          <Breadcrumb trail={trail} />
          <Hero {...heroPropsFromSettings(settings)} />
          <TrustBar />
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

  const { latest, sections, sale } = await getHomeSections();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[tCommon("sneakers")]} />
        <Hero {...heroPropsFromSettings(settings)} />
        <TrustBar />

        <CategorySection heading={t("latest")} products={latest} />

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
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

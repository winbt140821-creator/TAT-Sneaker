import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { ProductGrid } from "@/components/ProductGrid";
import { ThumbImage } from "@/components/ThumbImage";
import { Link } from "@/i18n/navigation";
import { getProducts, getRelatedProducts } from "@/lib/catalog";
import type { Department } from "@/lib/inventory";

// What a link to a hidden product opens — typically an old social post or
// ad. Rather than an error page, the shopper sees what the item was, that it
// is no longer sold, and what they can buy instead.
export async function DiscontinuedProduct({
  product,
  department,
}: {
  product: { id: string; name: string; images: string[]; categoryIds: string[] };
  department: Department;
}) {
  const [t, related] = await Promise.all([
    getTranslations("productDetail"),
    getRelatedProducts(product.id, product.categoryIds, 8),
  ]);
  const suggestions = related.length > 0 ? related : (await getProducts({ department, sort: "newest" })).products.slice(0, 8);
  const cover = product.images[0];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-12 text-center sm:flex-row sm:items-center sm:px-6 sm:text-left">
          {cover && (
            <div className="w-40 shrink-0 overflow-hidden bg-kraft-dark/30 sm:w-48">
              <ThumbImage
                src={cover}
                alt={product.name}
                width={384}
                height={384}
                className="aspect-square h-auto w-full object-cover opacity-70 grayscale"
              />
            </div>
          )}
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-stamp">
              {t("discontinuedLabel")}
            </p>
            <h1 className="mt-2 font-display text-2xl text-ink">{product.name}</h1>
            <p className="mt-3 font-body text-sm text-graphite">{t("discontinuedBody")}</p>
            <Link
              href="/"
              className="press mt-5 inline-block bg-ink px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
            >
              {t("discontinuedCta")}
            </Link>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 className="border-b border-kraft-dark pb-3 font-display text-xl text-ink">{t("related")}</h2>
            </div>
            <div className="mt-6">
              <ProductGrid products={suggestions} department={department} />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

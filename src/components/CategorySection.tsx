import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductGrid } from "./ProductGrid";

export async function CategorySection({
  heading,
  viewAllHref,
  pills,
  products,
}: {
  heading: string;
  viewAllHref?: string;
  pills?: { slug: string; label: string }[];
  products: CatalogProduct[];
}) {
  const t = await getTranslations("product");
  return (
    <section className="pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between border-b border-kraft-dark pb-3">
          <h2 className="font-display text-xl text-ink">{heading}</h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-wide text-forest hover:underline"
            >
              {t("viewAll")}
            </Link>
          )}
        </div>

        {pills && pills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((p) => (
              <Link
                key={p.slug}
                href={`/?category=${encodeURIComponent(p.slug)}`}
                className="die-cut-flat cursor-pointer bg-paper px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:border-forest hover:text-forest"
              >
                {p.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

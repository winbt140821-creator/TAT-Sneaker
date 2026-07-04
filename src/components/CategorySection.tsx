import { Link } from "@/i18n/navigation";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductGrid } from "./ProductGrid";

// Not async, and takes the translated label as a prop instead of calling
// getTranslations() itself — the homepage renders this once per brand
// section (a dozen+ times), and re-fetching the same "product" namespace
// that many times measurably added up (~0.5-1ms rendering aside, next-intl's
// own per-call overhead multiplied by a dozen instances).
export function CategorySection({
  heading,
  viewAllHref,
  viewAllLabel,
  pills,
  products,
}: {
  heading: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  pills?: { slug: string; label: string }[];
  products: CatalogProduct[];
}) {
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
              {viewAllLabel}
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

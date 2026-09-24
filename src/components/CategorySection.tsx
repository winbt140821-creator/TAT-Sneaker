import { Link } from "@/i18n/navigation";
import type { CatalogProduct } from "@/lib/catalog";
import type { Department } from "@/lib/inventory";
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
  department = "SHOES",
}: {
  heading: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  pills?: { slug: string; label: string }[];
  products: CatalogProduct[];
  department?: Department;
}) {
  if (department === "CLOTHING") {
    return (
      <section className="cv-auto pb-16 pt-14 lg:pb-20 lg:pt-16">
        <div className="mb-6 flex items-baseline justify-between px-4 sm:px-6 lg:px-8">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink">{heading}</h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-opacity hover:opacity-60"
            >
              {viewAllLabel}
            </Link>
          )}
        </div>
        <ProductGrid products={products} department={department} />
      </section>
    );
  }

  return (
    <section className="cv-auto pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between border-b border-kraft-dark pb-3">
          <h2 className="font-display text-xl text-ink">{heading}</h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="link-draw flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-wide text-forest"
            >
              {viewAllLabel}
            </Link>
          )}
        </div>

        {pills && pills.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            {pills.map((p) => (
              <Link
                key={p.slug}
                href={`/?category=${encodeURIComponent(p.slug)}`}
                className="die-cut-flat shrink-0 cursor-pointer bg-paper px-3 py-1.5 font-mono text-xs whitespace-nowrap text-ink transition-colors hover:border-forest hover:text-forest"
              >
                {p.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ProductGrid products={products} layout="scroll" department={department} />
      </div>
    </section>
  );
}

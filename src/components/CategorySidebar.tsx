import { Link } from "@/i18n/navigation";
import type { Department } from "@/lib/inventory";
import { FlameIcon, XMarkIcon } from "./icons";

type Child = {
  id: string;
  slug: string;
  label: string;
  hot: boolean;
  sale: boolean;
  _count: { products: number };
};
type Cat = {
  id: string;
  slug: string;
  label: string;
  hot: boolean;
  sale: boolean;
  children: Child[];
  _count: { products: number };
};

// Desktop only — hover-triggered flyout (CSS-only, no JS state) instead of a
// click accordion, matching the reference mega-menu: point at a brand and
// its sub-lines pop out to the right without navigating away.
export function CategorySidebar({
  categories,
  activeSlug,
  department = "SHOES",
}: {
  categories: Cat[];
  activeSlug?: string;
  department?: Department;
}) {
  const isClothing = department === "CLOTHING";

  // Reference sites (COS/Uniqlo) never fill navigation chrome with a
  // saturated brand color — it's plain text on white. The shoe site's solid
  // gold/red block stays as-is; clothing gets a quiet bordered column
  // instead, active state shown as a left accent rule + weight, not a tint.
  return (
    <nav
      aria-label="Danh mục sản phẩm"
      className={
        "hidden w-64 shrink-0 overflow-visible lg:block " +
        (isClothing ? "die-cut-flat bg-paper" : "die-cut bg-forest")
      }
    >
      <ul>
        {categories.map((c) => {
          const isActive = activeSlug === c.slug;
          return (
            <li
              key={c.id}
              className={
                "group/cat relative border-b last:border-0 " +
                (isClothing ? "border-kraft-dark" : "border-paper/15")
              }
            >
              <Link
                href={`/?category=${encodeURIComponent(c.slug)}`}
                className={
                  isClothing
                    ? "flex items-center gap-2 border-l-2 px-4 py-3 font-mono text-sm uppercase tracking-wide text-ink transition-colors hover:bg-kraft-dark/20 " +
                      (isActive ? "border-forest font-semibold" : "border-transparent")
                    : "flex items-center gap-2 px-4 py-3 font-mono text-sm uppercase tracking-wide text-paper transition-colors hover:bg-ink/10 " +
                      (isActive ? "bg-ink/15 font-semibold" : "")
                }
              >
                <span className="flex-1">{c.label}</span>
                {c.hot && <FlameIcon className="h-3.5 w-3.5 shrink-0" />}
                {c.sale && <XMarkIcon className="h-3.5 w-3.5 shrink-0" />}
              </Link>

              {c.children.length > 0 && (
                <div
                  className="invisible absolute left-full top-0 z-20 min-w-56 die-cut-flat bg-paper opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-150 group-hover/cat:visible group-hover/cat:opacity-100"
                >
                  <ul className="py-2">
                    {c.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/?category=${encodeURIComponent(child.slug)}`}
                          className="flex items-center gap-2 px-4 py-2 font-body text-sm text-ink transition-colors hover:bg-kraft-dark/20"
                        >
                          <span className="flex-1">{child.label}</span>
                          {child.hot && (
                            <span className="bg-forest px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-paper">
                              Hot
                            </span>
                          )}
                          <span className="font-mono text-xs text-graphite">({child._count.products})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

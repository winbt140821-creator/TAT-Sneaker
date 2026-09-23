import { Link } from "@/i18n/navigation";

type Child = { id: string; slug: string; label: string };
type Cat = { id: string; slug: string; label: string; children: Child[] };

// Desktop-only horizontal nav replacing the shoe site's sidebar for the
// clothing department — plain text on white with generous letter-spacing,
// matching how COS/Uniqlo present top-level category navigation instead of
// a persistent colored sidebar block.
export function ClothingCategoryNav({
  categories,
  activeSlug,
}: {
  categories: Cat[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Danh mục sản phẩm" className="hidden lg:block">
      <ul className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-4 sm:px-6">
        {categories.map((c) => {
          const isActive = activeSlug === c.slug;
          return (
            <li key={c.id} className="group/cat relative">
              <Link
                href={`/?category=${encodeURIComponent(c.slug)}`}
                className={
                  "block py-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors hover:text-ink " +
                  (isActive ? "text-ink font-semibold" : "text-graphite")
                }
              >
                {c.label}
              </Link>

              {c.children.length > 0 && (
                <div className="invisible absolute left-1/2 top-full z-20 min-w-48 -translate-x-1/2 border border-kraft-dark bg-paper opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-150 group-hover/cat:visible group-hover/cat:opacity-100">
                  <ul className="py-2">
                    {c.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/?category=${encodeURIComponent(child.slug)}`}
                          className="block px-4 py-2 text-center font-body text-sm whitespace-nowrap text-ink hover:bg-kraft"
                        >
                          {child.label}
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

import { Link } from "@/i18n/navigation";

type Child = { id: string; slug: string; label: string };
type Cat = { id: string; slug: string; label: string; children: Child[] };

// Desktop-only category links sitting inline in the header bar's left side,
// as small tracked uppercase text — the way COS lays out its top nav —
// instead of the shoe site's colored sidebar block.
export function ClothingCategoryNav({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Danh mục sản phẩm" className="hidden lg:block">
      <ul className="flex items-center gap-6">
        <li>
          <Link
            href="/?sort=newest"
            className="block py-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink"
          >
            <span className="link-draw">Mới về</span>
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id} className="group/cat relative">
            <Link
              href={`/?category=${encodeURIComponent(c.slug)}`}
              className="block py-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink"
            >
              <span className="link-draw">{c.label}</span>
            </Link>

            {c.children.length > 0 && (
              <div className="invisible absolute left-0 top-full z-20 min-w-48 border border-kraft-dark bg-paper opacity-0 transition-opacity duration-150 group-hover/cat:visible group-hover/cat:opacity-100">
                <ul className="py-3">
                  {c.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/?category=${encodeURIComponent(child.slug)}`}
                        className="block whitespace-nowrap px-4 py-1.5 font-body text-[13px] text-ink hover:opacity-60"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

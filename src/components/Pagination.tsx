import { getTranslations } from "next-intl/server";

// Server-rendered — plain <a href> page links, no client JS needed. Preserves
// every other active search param (category/q/sort/filters) by copying the
// current search params and only overwriting `page`, instead of dropping
// them like a bare `?page=N` would.
export async function Pagination({
  current,
  totalPages,
  searchParams,
}: {
  current: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations("common");

  // Relative (no leading "/") so this resolves against whatever path is
  // currently rendering it — reusable on any listing page, not just one
  // hardcoded route — while still preserving every other active param
  // (category/q/sort/filters) instead of dropping them like a bare
  // `?page=N` would.
  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  }

  // A window of up to 5 pages centered on the current one, always including
  // the first and last page.
  const windowSize = 5;
  let start = Math.max(1, current - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      aria-label={t("pagination")}
      className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-10 sm:px-6"
    >
      {start > 1 && (
        <>
          <a
            href={hrefFor(1)}
            className="die-cut-flat flex h-9 w-9 cursor-pointer items-center justify-center bg-paper font-mono text-sm text-ink transition-colors hover:bg-kraft-dark/40"
          >
            1
          </a>
          {start > 2 && <span className="px-1 font-mono text-sm text-graphite">…</span>}
        </>
      )}

      {pages.map((p) => (
        <a
          key={p}
          href={hrefFor(p)}
          aria-current={p === current ? "page" : undefined}
          className={
            p === current
              ? "die-cut-flat flex h-9 w-9 cursor-pointer items-center justify-center bg-ink font-mono text-sm text-paper"
              : "die-cut-flat flex h-9 w-9 cursor-pointer items-center justify-center bg-paper font-mono text-sm text-ink transition-colors hover:bg-kraft-dark/40"
          }
        >
          {p}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 font-mono text-sm text-graphite">…</span>}
          <a
            href={hrefFor(totalPages)}
            className="die-cut-flat flex h-9 cursor-pointer items-center justify-center bg-paper px-3 font-mono text-sm text-ink transition-colors hover:bg-kraft-dark/40"
          >
            {totalPages}
          </a>
        </>
      )}
    </nav>
  );
}

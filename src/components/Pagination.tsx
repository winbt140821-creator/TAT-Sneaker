import { useTranslations } from "next-intl";

export function Pagination({ current, total }: { current: number; total: number }) {
  const t = useTranslations("common");
  const pages = Array.from({ length: Math.min(total, 5) }, (_, i) => i + 1);

  return (
    <nav
      aria-label={t("pagination")}
      className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-10 sm:px-6"
    >
      {pages.map((p) => (
        <a
          key={p}
          href={`?page=${p}`}
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
      <span className="px-2 font-mono text-sm text-graphite">…</span>
      <a
        href={`?page=${total}`}
        className="die-cut-flat flex h-9 cursor-pointer items-center justify-center bg-paper px-3 font-mono text-sm text-ink transition-colors hover:bg-kraft-dark/40"
      >
        {total}
      </a>
    </nav>
  );
}

import Image from "next/image";
import { Link } from "@/i18n/navigation";

type ShowcaseCategory = { id: string; slug: string; label: string; showcaseImageUrl: string | null };

// Replaces CategoryShowcase's equal-tile grid for the clothing department —
// one large "lead" image plus smaller supporting tiles, numbered like plates
// in a real lookbook, instead of a uniform e-commerce category grid.
export function ClothingLookbook({ categories }: { categories: ShowcaseCategory[] }) {
  const items = categories.filter((c) => c.showcaseImageUrl).slice(0, 5);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
      <div className="flex items-baseline justify-between border-b border-kraft-dark pb-3">
        <h2 className="font-display text-2xl text-ink">Bộ sưu tập</h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-graphite">
          {String(items.length).padStart(2, "0")} danh mục
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((c, i) => (
          <Link
            key={c.id}
            href={`/?category=${encodeURIComponent(c.slug)}`}
            className={
              "group relative block overflow-hidden bg-kraft-dark/30 " +
              (i === 0 ? "aspect-[16/11] sm:col-span-2 sm:row-span-2" : "aspect-[4/5]")
            }
          >
            <Image
              src={c.showcaseImageUrl!}
              alt={c.label}
              fill
              sizes={i === 0 ? "(min-width: 640px) 66vw, 100vw" : "(min-width: 640px) 33vw, 100vw"}
              quality={90}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute left-3 top-3 border border-paper/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-paper">
              N°{String(i + 1).padStart(2, "0")}
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/80 to-transparent p-4">
              <span className="font-display text-lg text-paper">{c.label}</span>
              <span className="h-px w-8 shrink-0 origin-left scale-x-0 bg-paper transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

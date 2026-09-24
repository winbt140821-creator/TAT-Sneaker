import { ThumbImage } from "./ThumbImage";
import { Link } from "@/i18n/navigation";
import { Reveal } from "./motion/Reveal";

type ShowcaseCategory = { id: string; slug: string; label: string; showcaseImageUrl: string | null };

const COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

// "Shop by category" as full-bleed portrait photographs with a small
// caption beneath each — the way COS and Arket present their departments —
// instead of the shoe site's equal tiles with a dark gradient and a pill
// button. Images come from each category's showcase photo in admin.
export function ClothingLookbook({ categories }: { categories: ShowcaseCategory[] }) {
  const items = categories.filter((c) => c.showcaseImageUrl).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="cv-auto pb-16 pt-6 lg:pb-24">
      <h2 className="mb-6 px-4 text-[12px] font-medium uppercase tracking-[0.16em] text-ink sm:px-6 lg:px-8">
        Mua theo danh mục
      </h2>
      <div className={"grid grid-cols-2 gap-x-0.5 gap-y-8 " + (COLS[items.length] ?? "lg:grid-cols-4")}>
        {items.map((c) => (
          <Link key={c.id} href={`/?category=${encodeURIComponent(c.slug)}`} className="press group block">
            <Reveal className="relative aspect-[3/4] overflow-hidden bg-kraft">
              <ThumbImage
                src={c.showcaseImageUrl!}
                alt={c.label}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                quality={90}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
              />
            </Reveal>
            <p className="px-3 pt-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ink sm:px-4">
              {c.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

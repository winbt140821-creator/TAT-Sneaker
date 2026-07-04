import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type ShowcaseCategory = { id: string; slug: string; label: string; showcaseImageUrl: string | null };

export async function CategoryShowcase({ categories }: { categories: ShowcaseCategory[] }) {
  if (categories.length === 0) return null;
  const t = await getTranslations("home");
  const tProduct = await getTranslations("product");

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6">
      <h2 className="font-display text-2xl text-ink">{t("featuredCategories")}</h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?category=${encodeURIComponent(c.slug)}`}
            className="die-cut hover-lift group relative flex aspect-[4/3] items-end overflow-hidden bg-kraft-dark/30"
          >
            <Image
              src={c.showcaseImageUrl!}
              alt={c.label}
              fill
              sizes="(min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent"
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-start gap-2 p-4">
              <p className="font-display text-lg uppercase tracking-wide text-paper sm:text-xl">
                {c.label}
              </p>
              <span className="bg-paper px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink transition-colors group-hover:bg-forest group-hover:text-paper">
                {tProduct("viewAll")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

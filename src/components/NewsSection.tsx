import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import type { Department } from "@/lib/inventory";
import { NewsCarousel } from "./NewsCarousel";

const DATE_LOCALE: Record<string, string> = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };

// Each store shows only its own articles (admin → Tin tức, per store).
export async function NewsSection({ department = "SHOES" }: { department?: Department }) {
  const [articles, locale, t] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { department },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      take: department === "CLOTHING" ? 3 : 8,
    }),
    getLocale(),
    getTranslations("news"),
  ]);

  if (articles.length === 0) return null;
  const dateLabel = (d: Date) => d.toLocaleDateString(DATE_LOCALE[locale] ?? "vi-VN");

  if (department === "CLOTHING") {
    // Set like a journal page: three stories side by side under the same
    // small uppercase heading the product sections use, portrait photos
    // edge to edge, no cards.
    return (
      <section className="cv-auto border-t border-kraft-dark pb-16 pt-14 lg:pb-20 lg:pt-16">
        <h2 className="mb-6 px-4 text-[12px] font-medium uppercase tracking-[0.16em] text-ink sm:px-6 lg:px-8">
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 gap-x-0.5 gap-y-10 sm:grid-cols-3">
          {articles.map((a) => (
            <article key={a.id}>
              <div className="relative aspect-[4/5] bg-kraft">
                {a.imageUrl && (
                  <Image
                    src={a.imageUrl}
                    alt={a.title}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="px-4 pt-4 sm:px-3 lg:px-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-graphite">{dateLabel(a.publishedAt)}</p>
                <h3 className="mt-2 font-display text-xl leading-snug text-ink">{a.title}</h3>
                <p className="mt-2 line-clamp-3 font-body text-[13px] leading-relaxed text-graphite">{a.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="cv-auto pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="border-b border-kraft-dark pb-3 font-display text-xl text-ink">{t("title")}</h2>
        <div className="mt-6">
          <NewsCarousel
            items={articles.map((a) => ({
              id: a.id,
              title: a.title,
              excerpt: a.excerpt,
              imageUrl: a.imageUrl,
              publishedAtLabel: dateLabel(a.publishedAt),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { NewsCarousel } from "./NewsCarousel";

const DATE_LOCALE: Record<string, string> = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };

export async function NewsSection() {
  const [articles, locale, t] = await Promise.all([
    prisma.newsArticle.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      take: 8,
    }),
    getLocale(),
    getTranslations("news"),
  ]);

  if (articles.length === 0) return null;

  return (
    <section className="pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="border-b border-kraft-dark pb-3 font-display text-xl text-ink">{t("title")}</h2>
        <div className="mt-6">
          <NewsCarousel
            items={articles.map((a) => ({
              id: a.id,
              title: a.title,
              excerpt: a.excerpt,
              imageUrl: a.imageUrl,
              publishedAtLabel: a.publishedAt.toLocaleDateString(DATE_LOCALE[locale] ?? "vi-VN"),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

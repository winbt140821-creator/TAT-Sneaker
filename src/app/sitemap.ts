import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL, localizedUrl, languageAlternates } from "@/lib/seo";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({ select: { id: true, updatedAt: true } }),
    prisma.category.findMany({ where: { parentId: null }, select: { slug: true } }),
    prisma.staticPage.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: languageAlternates("") },
    },
    ...categories.map((c) => {
      const path = `/?category=${encodeURIComponent(c.slug)}`;
      return {
        url: localizedUrl(path, routing.defaultLocale),
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: { languages: languageAlternates(path) },
      };
    }),
    ...products.map((p) => {
      const path = `/san-pham/${p.id}`;
      return {
        url: localizedUrl(path, routing.defaultLocale),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: { languages: languageAlternates(path) },
      };
    }),
    ...pages.map((p) => {
      const path = `/trang/${p.slug}`;
      return {
        url: localizedUrl(path, routing.defaultLocale),
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.3,
        alternates: { languages: languageAlternates(path) },
      };
    }),
  ];
}

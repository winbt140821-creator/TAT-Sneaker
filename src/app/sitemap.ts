import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { localizedUrl, languageAlternates } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import type { Department } from "@/lib/inventory";

// One sitemap for the whole domain: the gateway, both stores' homepages,
// categories and products (each under its own store's URL, see
// src/lib/store-path.ts), and each store's own content pages (a store
// without its own copy of a page serves the shoe store's, which is listed).
// connection() keeps it rendered per request, so it always reflects the
// current catalog instead of whatever existed at build time.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({ where: { hidden: false }, select: { id: true, updatedAt: true, department: true } }),
    prisma.category.findMany({ where: { parentId: null }, select: { slug: true, department: true } }),
    prisma.staticPage.findMany({ select: { slug: true, updatedAt: true, department: true } }),
  ]);

  const entry = (
    path: string,
    department: Department | null,
    extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">
  ) => ({
    url: localizedUrl(path, routing.defaultLocale, department),
    alternates: { languages: languageAlternates(path, department) },
    ...extra,
  });

  return [
    entry("/", null, { lastModified: new Date(), changeFrequency: "weekly", priority: 1 }),
    entry("/", "SHOES", { lastModified: new Date(), changeFrequency: "daily", priority: 1 }),
    entry("/", "CLOTHING", { lastModified: new Date(), changeFrequency: "daily", priority: 1 }),
    ...categories.map((c) =>
      entry(`/?category=${encodeURIComponent(c.slug)}`, c.department, { changeFrequency: "daily", priority: 0.8 })
    ),
    ...products.map((p) =>
      entry(`/san-pham/${p.id}`, p.department, { lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.7 })
    ),
    ...pages.map((p) =>
      entry(`/trang/${p.slug}`, p.department, { lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.3 })
    ),
  ];
}

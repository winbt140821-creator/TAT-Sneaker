import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrlForDepartment, localizedUrl, languageAlternates } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { getDepartment } from "@/lib/department";

// Dynamic (calls getDepartment(), which reads next/headers) so
// quanao.tatsneaker.vn/sitemap.xml and tatsneaker.vn/sitemap.xml — the same
// deployment, two hostnames — each list only their own department's
// products/categories under their own domain, instead of one sitemap
// leaking the other department's URLs or 404ing on the second hostname.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const department = await getDepartment();
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({ where: { department }, select: { id: true, updatedAt: true } }),
    prisma.category.findMany({ where: { parentId: null, department }, select: { slug: true } }),
    // Static content pages (policies, guides...) are shared business-wide —
    // listed under both domains, since the same /trang/[slug] route exists
    // on both storefronts.
    prisma.staticPage.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  return [
    {
      url: siteUrlForDepartment(department),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: languageAlternates("", department) },
    },
    ...categories.map((c) => {
      const path = `/?category=${encodeURIComponent(c.slug)}`;
      return {
        url: localizedUrl(path, routing.defaultLocale, department),
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: { languages: languageAlternates(path, department) },
      };
    }),
    ...products.map((p) => {
      const path = `/san-pham/${p.id}`;
      return {
        url: localizedUrl(path, routing.defaultLocale, department),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: { languages: languageAlternates(path, department) },
      };
    }),
    ...pages.map((p) => {
      const path = `/trang/${p.slug}`;
      return {
        url: localizedUrl(path, routing.defaultLocale, department),
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.3,
        alternates: { languages: languageAlternates(path, department) },
      };
    }),
  ];
}

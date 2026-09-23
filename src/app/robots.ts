import type { MetadataRoute } from "next";
import { siteUrlForDepartment } from "@/lib/seo";
import { getDepartment } from "@/lib/department";

// Dynamic for the same reason as sitemap.ts — points each hostname's
// robots.txt at that hostname's own sitemap.xml, not always the shoe site's.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const department = await getDepartment();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrlForDepartment(department)}/sitemap.xml`,
  };
}

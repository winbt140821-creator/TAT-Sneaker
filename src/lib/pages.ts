import { cache } from "react";
import { prisma } from "./db";
import type { Department } from "./inventory";

// A store's own version of a content page, or the shoe store's when it has
// none yet — the footer links the same slugs in both stores, and the shoe
// store's pages predate the clothing store. Cached per request:
// generateMetadata() and the page component both call this.
export const getStaticPage = cache(async (slug: string, department: Department) => {
  const pages = await prisma.staticPage.findMany({
    where: { slug, department: { in: [department, "SHOES"] } },
  });
  return pages.find((p) => p.department === department) ?? pages[0] ?? null;
});

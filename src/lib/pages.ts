import { cache } from "react";
import { prisma } from "./db";

// Cached per-request — generateMetadata() and the page component both call
// this with the same slug.
export const getStaticPage = cache((slug: string) => {
  return prisma.staticPage.findUnique({ where: { slug } });
});

export function getAllStaticPages() {
  return prisma.staticPage.findMany({ orderBy: { title: "asc" } });
}

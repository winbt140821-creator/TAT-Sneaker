"use server";

import { prisma } from "@/lib/db";

export type SearchSuggestion = { id: string; name: string; image: string | null; price: number };

/** Lightweight product lookup for the header's live search dropdown — a
 *  trimmed-down version of getProducts() (src/lib/catalog.ts) without sale
 *  price/category filtering, since a handful of name/SKU matches is all a
 *  type-ahead needs. */
export async function searchSuggestionsAction(q: string): Promise<SearchSuggestion[]> {
  const query = q.trim();
  if (!query) return [];

  const products = await prisma.product.findMany({
    where: { OR: [{ name: { contains: query } }, { sku: { contains: query } }] },
    select: { id: true, name: true, images: true, price: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    image: (JSON.parse(p.images || "[]") as string[])[0] ?? null,
    price: p.price,
  }));
}

/** Shown the moment the search box is focused, before the customer has typed
 *  anything — a handful of newest arrivals so the dropdown isn't empty on
 *  first click (per the "show suggestions when clicked" feedback). */
export async function defaultSuggestionsAction(): Promise<SearchSuggestion[]> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true, price: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    image: (JSON.parse(p.images || "[]") as string[])[0] ?? null,
    price: p.price,
  }));
}

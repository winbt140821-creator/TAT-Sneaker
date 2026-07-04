import { cache } from "react";
import { prisma } from "./db";

export async function getNavCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

function parseProduct<T extends { sizeQuantities: string; images: string }>(
  p: T
) {
  return {
    ...p,
    sizeQuantities: JSON.parse(p.sizeQuantities) as Record<string, number>,
    images: JSON.parse(p.images) as string[],
  };
}

export type ProductSort = "popularity" | "newest" | "price-asc" | "price-desc";

const SORT_ORDER_BY: Record<ProductSort, { createdAt?: "asc" | "desc"; price?: "asc" | "desc" }> = {
  // No real popularity metric yet — falls back to newest, same as the default.
  popularity: { createdAt: "desc" },
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
};

export async function getProducts({
  categorySlug,
  q,
  minPrice,
  maxPrice,
  size,
  availability,
  sort = "popularity",
}: {
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: number;
  availability?: "IN_STOCK" | "PREORDER";
  sort?: ProductSort;
} = {}) {
  // These four values usually come straight from URL search params, which a
  // visitor can edit by hand into anything — guard against NaN/garbage
  // reaching Prisma (SQLite errors on a NaN bind param; an unrecognized
  // enum value throws a validation error).
  const safeMinPrice = Number.isFinite(minPrice) ? minPrice : undefined;
  const safeMaxPrice = Number.isFinite(maxPrice) ? maxPrice : undefined;
  const safeSize = Number.isFinite(size) ? size : undefined;
  const safeAvailability =
    availability === "IN_STOCK" || availability === "PREORDER" ? availability : undefined;
  const safeSort = sort in SORT_ORDER_BY ? sort : "popularity";

  const products = await prisma.product.findMany({
    where: {
      ...(categorySlug === "SALE"
        ? { originalPrice: { not: null } }
        : categorySlug
          ? { categories: { some: { slug: categorySlug } } }
          : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
      ...(safeMinPrice != null ? { price: { gte: safeMinPrice } } : {}),
      ...(safeMaxPrice != null ? { price: { lte: safeMaxPrice } } : {}),
      ...(safeAvailability ? { availability: safeAvailability } : {}),
    },
    orderBy: SORT_ORDER_BY[safeSort],
  });

  const parsed = products.map(parseProduct);

  // sizeQuantities is JSON-encoded in the DB (SQLite has no queryable JSON
  // path here), so the size filter is applied in JS after fetching.
  if (safeSize == null) return parsed;
  return parsed.filter((p) => (p.sizeQuantities[String(safeSize)] ?? 0) > 0);
}

export type CatalogProduct = Awaited<ReturnType<typeof getProducts>>[number];

// Cached per-request so generateMetadata() and the page component (both call
// this with the same id) only hit the database once.
export const getProductById = cache(async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { categories: true },
  });
  return product ? parseProduct(product) : null;
});

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  return products.map(parseProduct);
}

export async function getRelatedProducts(
  productId: string,
  categoryIds: string[],
  limit = 4
) {
  if (categoryIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: {
      id: { not: productId },
      categories: { some: { id: { in: categoryIds } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(parseProduct);
}

const HOME_SECTION_SIZE = 8;

/** Latest products overall, one section per top-level category (skipping empty
 *  ones and the computed "SALE" tag), and a separate sale section. */
export async function getHomeSections() {
  const [latest, categories, sale] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: HOME_SECTION_SIZE }),
    prisma.category.findMany({
      where: { parentId: null, sale: false },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.product.findMany({
      where: { originalPrice: { not: null } },
      orderBy: { createdAt: "desc" },
      take: HOME_SECTION_SIZE,
    }),
  ]);

  const sections = await Promise.all(
    categories.map(async (category) => {
      const products = await prisma.product.findMany({
        where: { categories: { some: { id: category.id } } },
        orderBy: { createdAt: "desc" },
        take: HOME_SECTION_SIZE,
      });
      return { category, products: products.map(parseProduct) };
    })
  );

  return {
    latest: latest.map(parseProduct),
    sections: sections.filter((s) => s.products.length > 0),
    sale: sale.map(parseProduct),
  };
}

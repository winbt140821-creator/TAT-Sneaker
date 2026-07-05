import { cache } from "react";
import { prisma } from "./db";
import { getActiveCampaigns, salePriceFor, saleProductIds } from "./sale";

// Cached per-request — Header (mobile drawer) and the homepage (desktop
// sidebar) both need this, so dedupe to a single query per request.
export const getNavCategories = cache(() => {
  return prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
});

// Includes children (for the pills row when viewing a parent category) and
// parent.children — i.e. siblings — for when the active category is itself
// a leaf sub-category (viewing "Jordan 1 Low" shows pills for every other
// Air Jordan sub-line, matching the reference design).
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
      parent: { include: { children: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } } },
    },
  });
}

// Admin-curated "featured categories" grid near the bottom of the homepage —
// only categories explicitly toggled on with a representative photo appear.
export const getShowcaseCategories = cache(() => {
  return prisma.category.findMany({
    where: { showcaseEnabled: true, showcaseImageUrl: { not: null } },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
});

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

  const campaigns = await getActiveCampaigns();
  const saleIds = categorySlug === "SALE" ? saleProductIds(campaigns) : null;

  const products = await prisma.product.findMany({
    where: {
      ...(categorySlug === "SALE"
        ? saleIds === "ALL"
          ? {}
          : { id: { in: saleIds ?? [] } }
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

  const parsed = products
    .map(parseProduct)
    .map((p) => ({ ...p, ...salePriceFor(p.id, p.price, campaigns) }));

  // sizeQuantities is JSON-encoded in the DB (SQLite has no queryable JSON
  // path here), so the size filter is applied in JS after fetching.
  if (safeSize == null) return parsed;
  return parsed.filter((p) => (p.sizeQuantities[String(safeSize)] ?? 0) > 0);
}

export type CatalogProduct = Awaited<ReturnType<typeof getProducts>>[number];

// Cached per-request so generateMetadata() and the page component (both call
// this with the same id) only hit the database once.
export const getProductById = cache(async (id: string) => {
  const [product, campaigns] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { categories: true } }),
    getActiveCampaigns(),
  ]);
  if (!product) return null;
  const parsed = parseProduct(product);
  return { ...parsed, ...salePriceFor(parsed.id, parsed.price, campaigns) };
});

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids } } }),
    getActiveCampaigns(),
  ]);
  return products
    .map(parseProduct)
    .map((p) => ({ ...p, ...salePriceFor(p.id, p.price, campaigns) }));
}

export async function getRelatedProducts(
  productId: string,
  categoryIds: string[],
  limit = 4
) {
  if (categoryIds.length === 0) return [];
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({
      where: {
        id: { not: productId },
        categories: { some: { id: { in: categoryIds } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    getActiveCampaigns(),
  ]);
  return products
    .map(parseProduct)
    .map((p) => ({ ...p, ...salePriceFor(p.id, p.price, campaigns) }));
}

const HOME_SECTION_SIZE = 8;

/** Latest products overall, one section per top-level category (skipping empty
 *  ones and the computed "SALE" tag), and a separate sale section. */
export async function getHomeSections() {
  const campaigns = await getActiveCampaigns();
  const saleIds = saleProductIds(campaigns);

  const [latest, categories, sale, bestSellingGroups] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: HOME_SECTION_SIZE }),
    prisma.category.findMany({
      where: { parentId: null, sale: false },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.product.findMany({
      where: saleIds === "ALL" ? {} : { id: { in: saleIds } },
      orderBy: { createdAt: "desc" },
      take: HOME_SECTION_SIZE,
    }),
    // Ranked by total units sold across non-cancelled orders — cancelled
    // orders never reflect real demand for the item.
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: HOME_SECTION_SIZE,
    }),
  ]);

  const withSale = <T extends { id: string; price: number }>(products: T[]) =>
    products.map((p) => ({ ...p, ...salePriceFor(p.id, p.price, campaigns) }));

  // One query for every section's products instead of one query per
  // category (was N+1 — each of the ~10 brand rows ran its own findMany).
  // createdAt-desc order is preserved per category since it's already
  // globally sorted before the per-category split below.
  const categoryIds = categories.map((c) => c.id);
  const allSectionProducts =
    categoryIds.length > 0
      ? await prisma.product.findMany({
          where: { categories: { some: { id: { in: categoryIds } } } },
          include: { categories: { select: { id: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const sections = categories.map((category) => {
    const products = allSectionProducts
      .filter((p) => p.categories.some((c) => c.id === category.id))
      .slice(0, HOME_SECTION_SIZE);
    return { category, products: withSale(products.map(parseProduct)) };
  });

  const bestSellingProducts = bestSellingGroups.length
    ? await prisma.product.findMany({ where: { id: { in: bestSellingGroups.map((g) => g.productId) } } })
    : [];
  const bestSellingById = new Map(bestSellingProducts.map((p) => [p.id, p]));
  // groupBy's own order (by total units sold) has to be reapplied — findMany
  // with `id: { in: [...] }` doesn't preserve the order of the id list.
  const bestSelling = bestSellingGroups
    .map((g) => bestSellingById.get(g.productId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return {
    latest: withSale(latest.map(parseProduct)),
    sections: sections.filter((s) => s.products.length > 0),
    sale: withSale(sale.map(parseProduct)),
    bestSelling: withSale(bestSelling.map(parseProduct)),
  };
}

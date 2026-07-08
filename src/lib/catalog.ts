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

const SORT_ORDER_BY: Record<
  ProductSort,
  { sortOrder?: "asc" | "desc"; createdAt?: "asc" | "desc"; price?: "asc" | "desc" }
> = {
  // The default/"no sort picked" view — admin's manually-set display order
  // (src/app/admin/(protected)/products/page.tsx up/down buttons).
  popularity: { sortOrder: "asc" },
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
};

// Fields every card (ProductCard, JSON-LD, wishlist) actually renders — every
// listing query below selects only this, instead of also pulling costPrice,
// description, videoUrl, depositAmount, shippingFee, etc. into a card-only
// render path.
const CATALOG_SELECT = {
  id: true,
  name: true,
  price: true,
  quality: true,
  accent: true,
  sizeQuantities: true,
  images: true,
  availability: true,
  leadTimeMinDays: true,
  leadTimeMaxDays: true,
} as const;

export const CATALOG_PAGE_SIZE = 24;

export async function getProducts({
  categorySlug,
  q,
  minPrice,
  maxPrice,
  size,
  availability,
  sort = "popularity",
  page = 1,
}: {
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: number;
  availability?: "IN_STOCK" | "PREORDER";
  sort?: ProductSort;
  page?: number;
} = {}) {
  // These values usually come straight from URL search params, which a
  // visitor can edit by hand into anything — guard against NaN/garbage
  // reaching Prisma (SQLite errors on a NaN bind param; an unrecognized
  // enum value throws a validation error).
  const safeMinPrice = Number.isFinite(minPrice) ? minPrice : undefined;
  const safeMaxPrice = Number.isFinite(maxPrice) ? maxPrice : undefined;
  const safeSize = Number.isFinite(size) ? size : undefined;
  const safeAvailability =
    availability === "IN_STOCK" || availability === "PREORDER" ? availability : undefined;
  const safeSort = sort in SORT_ORDER_BY ? sort : "popularity";
  const safePage = Number.isFinite(page) && page! > 0 ? Math.floor(page!) : 1;

  const campaigns = await getActiveCampaigns();
  const saleIds = categorySlug === "SALE" ? saleProductIds(campaigns) : null;

  const where = {
    hidden: false,
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
  };

  // sizeQuantities is JSON-encoded in the DB (SQLite has no queryable JSON
  // path here), so a size filter can't be expressed in SQL — every matching
  // row has to be fetched and filtered in JS first, and only then can this
  // page's slice be taken. Every other filter combo paginates in SQL below.
  if (safeSize != null) {
    const allMatching = await prisma.product.findMany({
      where,
      select: CATALOG_SELECT,
      orderBy: SORT_ORDER_BY[safeSort],
    });
    const filtered = allMatching
      .map(parseProduct)
      .filter((p) => (p.sizeQuantities[String(safeSize)] ?? 0) > 0)
      .map((p) => ({ ...p, ...salePriceFor(p.id, p.price, campaigns) }));
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
    const products = filtered.slice(
      (safePage - 1) * CATALOG_PAGE_SIZE,
      safePage * CATALOG_PAGE_SIZE
    );
    return { products, totalCount, totalPages };
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: CATALOG_SELECT,
      orderBy: SORT_ORDER_BY[safeSort],
      skip: (safePage - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
  const parsed = products
    .map(parseProduct)
    .map((p) => ({ ...p, ...salePriceFor(p.id, p.price, campaigns) }));

  return { products: parsed, totalCount, totalPages };
}

export type CatalogProduct = Awaited<ReturnType<typeof getProducts>>["products"][number];

// Cached per-request so generateMetadata() and the page component (both call
// this with the same id) only hit the database once.
export const getProductById = cache(async (id: string) => {
  const [product, campaigns] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { categories: true } }),
    getActiveCampaigns(),
  ]);
  if (!product || product.hidden) return null;
  const parsed = parseProduct(product);
  return { ...parsed, ...salePriceFor(parsed.id, parsed.price, campaigns) };
});

// The full row (all columns, e.g. sku) — distinct from CatalogProduct, which
// is narrowed to only what a catalog-listing card renders.
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductById>>>;

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids }, hidden: false }, select: CATALOG_SELECT }),
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
        hidden: false,
        categories: { some: { id: { in: categoryIds } } },
      },
      select: CATALOG_SELECT,
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
    prisma.product.findMany({
      where: { hidden: false },
      select: CATALOG_SELECT,
      orderBy: { createdAt: "desc" },
      take: HOME_SECTION_SIZE,
    }),
    prisma.category.findMany({
      where: { parentId: null, sale: false },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.product.findMany({
      where: { hidden: false, ...(saleIds === "ALL" ? {} : { id: { in: saleIds } }) },
      select: CATALOG_SELECT,
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
          where: { hidden: false, categories: { some: { id: { in: categoryIds } } } },
          select: { ...CATALOG_SELECT, categories: { select: { id: true } } },
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
    ? await prisma.product.findMany({
        where: { id: { in: bestSellingGroups.map((g) => g.productId) }, hidden: false },
        select: CATALOG_SELECT,
      })
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

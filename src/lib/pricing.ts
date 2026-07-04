// Client-safe pricing helpers — kept out of catalog.ts because that module
// pulls in Prisma/better-sqlite3, which can't be bundled into client components.
export function getDiscountPct(price: number, originalPrice?: number | null) {
  return originalPrice ? Math.round(100 - (price / originalPrice) * 100) : null;
}

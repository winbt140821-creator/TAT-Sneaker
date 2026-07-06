// Product.sizeQuantities is a JSON-encoded Record<string, number> — e.g.
// {"36": 2, "37": 0, "40": 5}. A size key's presence means the product
// carries that size at all (shown to customers, greyed out if sold out);
// its value is how many pairs are currently in stock for that size.
export type SizeQuantities = Record<string, number>;

export const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];

export function parseSizeQuantities(raw: string): SizeQuantities {
  return JSON.parse(raw) as SizeQuantities;
}

export function getCarriedSizes(sq: SizeQuantities): number[] {
  return Object.keys(sq).map(Number).sort((a, b) => a - b);
}

export function getAvailableSizes(sq: SizeQuantities): number[] {
  return getCarriedSizes(sq).filter((s) => (sq[String(s)] ?? 0) > 0);
}

export function getQuantityForSize(sq: SizeQuantities, size: number): number {
  return sq[String(size)] ?? 0;
}

export function getTotalQuantity(sq: SizeQuantities): number {
  return Object.values(sq).reduce((sum, q) => sum + Math.max(0, q), 0);
}

export function hasAnyStock(sq: SizeQuantities): boolean {
  return Object.values(sq).some((q) => q > 0);
}

// Preorder products don't track real inventory per size — every size is
// orderable, just with a longer lead time. Admin only edits a size's
// quantity when real ready stock exists for it (e.g. "1" pair on hand);
// everything else sits at this sentinel, meaning "preorder only, no stock
// on hand yet". A size counts as real/ready stock only when its quantity
// differs from this default — 100 itself is never treated as real stock.
export const PREORDER_DEFAULT_QTY = 100;

export function hasRealStockForSize(qty: number): boolean {
  return qty > 0 && qty !== PREORDER_DEFAULT_QTY;
}

// Matches the IN_STOCK default in ProductForm's LEAD_TIME_DEFAULTS — used to
// message a specific size's real lead time (e.g. picking a preorder
// product's one real-stock size should say "3-5 days", not the product's
// own PREORDER-wide 10-15 day lead time).
export const IN_STOCK_LEAD_TIME = { min: 3, max: 5 } as const;

/** True if the product has real ready stock for at least one size — used to
 *  show "Có sẵn" instead of "Đặt trước" even on a PREORDER-flagged product
 *  once at least one size has been given a real (non-sentinel) quantity. */
export function hasRealStockAnywhere(sq: SizeQuantities): boolean {
  return Object.values(sq).some(hasRealStockForSize);
}

/** Sizes to show on the admin inventory page. For PREORDER products, sizes
 *  still sitting at the sentinel default aren't physical stock and would
 *  otherwise make the warehouse view look like there are hundreds of pairs
 *  on hand — those are excluded. A size that WAS given a real quantity but
 *  has since sold down to 0 stays visible (still tracked, just out of stock)
 *  so admin can restock it with the +/- steppers. IN_STOCK products don't
 *  use the sentinel at all, so every carried size is real. */
export function getRealStockSizes(sq: SizeQuantities, isPreorder: boolean): number[] {
  const sizes = getCarriedSizes(sq);
  return isPreorder ? sizes.filter((s) => (sq[String(s)] ?? 0) !== PREORDER_DEFAULT_QTY) : sizes;
}

export function getRealStockTotal(sq: SizeQuantities, isPreorder: boolean): number {
  return getRealStockSizes(sq, isPreorder).reduce((sum, s) => sum + (sq[String(s)] ?? 0), 0);
}

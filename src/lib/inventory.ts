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

import { cache } from "react";
import { prisma } from "./db";
import { getCarriedSizes, getRealStockTotal, hasAnyStock, type SizeQuantities } from "./inventory";

// Both the admin dashboard ("Sản phẩm hết hàng" card) and the inventory page
// ("Tổng số đôi toàn kho") independently ran their own full-table
// product.findMany just to derive one number each from the same
// sizeQuantities/availability columns — same scan, same per-row JSON parse,
// duplicated in two places. One shared, cache()-wrapped pass computes both.
export const getStockSummary = cache(async () => {
  const products = await prisma.product.findMany({
    select: { sizeQuantities: true, availability: true },
  });

  let outOfStockCount = 0;
  let grandTotal = 0;
  for (const p of products) {
    const sq = JSON.parse(p.sizeQuantities) as SizeQuantities;
    if (getCarriedSizes(sq).length > 0 && !hasAnyStock(sq)) outOfStockCount++;
    grandTotal += getRealStockTotal(sq, p.availability === "PREORDER");
  }

  return { outOfStockCount, grandTotal };
});

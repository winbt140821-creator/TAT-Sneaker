"use server";

import { getProductsByIds } from "@/lib/catalog";

export async function getWishlistProductsAction(ids: string[]) {
  return getProductsByIds(ids);
}

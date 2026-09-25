import type { Prisma } from "@/generated/prisma/client";
import { storeWhere, type AdminStore } from "./admin-store";

// The filters on Sản phẩm (search, "chưa có ảnh", "chưa có giá", "nhập từ
// Yupoo", one category) — shared by the list and by the bulk actions, so
// "áp dụng cho tất cả sản phẩm đang lọc" means exactly the rows the list
// shows.
export type ProductListFilter = {
  store: AdminStore;
  q?: string;
  noImage?: boolean;
  noPrice?: boolean;
  imported?: boolean;
  categoryId?: string;
};

export function productListWhere(f: ProductListFilter): Prisma.ProductWhereInput {
  const q = f.q?.trim();
  return {
    // A category already belongs to one store; the store switch only
    // narrows the overall list.
    ...(f.categoryId ? { categories: { some: { id: f.categoryId } } } : storeWhere(f.store)),
    ...(f.noImage ? { images: "[]" } : {}),
    ...(f.noPrice ? { price: { lte: 0 } } : {}),
    ...(f.imported ? { sourceUrl: { not: null } } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
  };
}

/** The same filter, read back from a form's hidden fields or the URL. */
export function readProductListFilter(get: (key: string) => string | null | undefined, store: AdminStore): ProductListFilter {
  return {
    store,
    q: get("q") ?? undefined,
    noImage: get("noImage") === "1",
    noPrice: get("noPrice") === "1",
    imported: get("imported") === "1",
    categoryId: get("category") || undefined,
  };
}

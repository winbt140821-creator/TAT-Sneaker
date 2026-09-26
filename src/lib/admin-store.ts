import { cookies } from "next/headers";
import type { Department } from "./inventory";

// Which store the admin is currently managing — set by the Tất cả | Giày |
// Quần áo switch at the top of every admin page (AdminStoreSwitcher) and
// remembered in a cookie, so staff pick once and every list (products,
// stock, sale, categories, orders, revenue, dashboard) follows it.
// Server-only (next/headers).
export type AdminStore = Department | "ALL";

export const ADMIN_STORE_COOKIE = "admin_store";

export { STORE_LABEL } from "./store-label";

export async function getAdminStore(): Promise<AdminStore> {
  const value = (await cookies()).get(ADMIN_STORE_COOKIE)?.value;
  return value === "SHOES" || value === "CLOTHING" ? value : "ALL";
}

/** Prisma `where` fragment for rows that belong to one store (products,
 *  categories). Empty when managing both. */
export function storeWhere(store: AdminStore): { department?: Department } {
  return store === "ALL" ? {} : { department: store };
}

/** Prisma `where` fragment for orders containing at least one item from the
 *  store. The two stores share one cart, so an order can hold both — it
 *  then shows under either store. */
export function orderStoreWhere(store: AdminStore) {
  return store === "ALL" ? {} : { items: { some: { product: { department: store } } } };
}

/** Same, for rows where no store means "both stores" (social links and
 *  connected Facebook pages): those show under either store. */
export function sharedOrStoreWhere(store: AdminStore) {
  return store === "ALL" ? {} : { OR: [{ department: null }, { department: store }] };
}

/** Reads a store picked in an admin form; anything else is null. */
export function readDepartment(value: FormDataEntryValue | null): Department | null {
  return value === "SHOES" || value === "CLOTHING" ? value : null;
}

/** For pages that edit exactly one store's data (categories, logo, homepage
 *  cover): an explicit ?department= in the URL wins, then the switch, then
 *  the shoe store. */
export function editingStore(param: string | undefined, store: AdminStore): Department {
  if (param === "SHOES" || param === "CLOTHING") return param;
  return store === "ALL" ? "SHOES" : store;
}

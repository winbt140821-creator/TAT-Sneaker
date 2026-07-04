import { createLocalStore } from "./local-store";

const EMPTY_WISHLIST: string[] = [];
const store = createLocalStore<string[]>("cop_wishlist", "cop-wishlist-changed", EMPTY_WISHLIST);

export const getWishlistSnapshot = store.getSnapshot;
export const getServerWishlistSnapshot = store.getServerSnapshot;
export const subscribeWishlist = store.subscribe;
export const readWishlist = store.read;

export function toggleWishlist(productId: string) {
  const ids = readWishlist();
  const next = ids.includes(productId)
    ? ids.filter((id) => id !== productId)
    : [...ids, productId];
  store.write(next);
}

export function removeFromWishlist(productId: string) {
  store.write(readWishlist().filter((id) => id !== productId));
}

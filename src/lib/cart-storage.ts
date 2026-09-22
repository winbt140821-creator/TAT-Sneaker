import { createCookieStore } from "./local-store";

export type CartItem = { productId: string; size: string; quantity: number };

const EMPTY_CART: CartItem[] = [];
// Cookie-backed (not localStorage) so the cart follows a shopper between
// tatsneaker.vn and quanao.tatsneaker.vn — see createCookieStore's comment.
const store = createCookieStore<CartItem[]>("cop_cart", "cop-cart-changed", EMPTY_CART);

export const getCartSnapshot = store.getSnapshot;
export const getServerCartSnapshot = store.getServerSnapshot;
export const subscribeCart = store.subscribe;
export const readCart = store.read;

export function addToCart(productId: string, size: string, quantity = 1) {
  const items = readCart();
  const existing = items.find((i) => i.productId === productId && i.size === size);
  const next = existing
    ? items.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
    : [...items, { productId, size, quantity }];
  store.write(next);
}

export function updateCartQuantity(productId: string, size: string, quantity: number) {
  const items = readCart()
    .map((i) => (i.productId === productId && i.size === size ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  store.write(items);
}

export function removeFromCart(productId: string, size: string) {
  store.write(readCart().filter((i) => !(i.productId === productId && i.size === size)));
}

export function clearCart() {
  store.write([]);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

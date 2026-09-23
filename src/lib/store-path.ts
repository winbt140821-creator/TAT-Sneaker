import type { Department } from "./inventory";

// Both storefronts live on tatsneaker.vn, told apart by the first path
// segment (after the locale, if any):
//
//   /                      the shared gateway page (pick a store)
//   /giay                  shoe homepage + listings (/giay?category=…)
//   /san-pham/…, /gio-hang shoe store — every other unprefixed path, which
//                          keeps every shoe URL shared/indexed before the
//                          merge working unchanged
//   /quan-ao/…             clothing store — the same routes, prefixed
//
// src/proxy.ts strips the prefix and serves the same route tree for both,
// telling pages which store they're in via the x-department header. Links
// everywhere are written store-agnostic ("/", "/san-pham/x", "/gio-hang")
// and pass through storeHref() — see src/i18n/navigation.ts — so a link in
// the clothing header automatically stays inside the clothing store.
// Isomorphic: imported by the proxy, server components and client code.

export const STORE_PREFIX: Record<Department, string> = { SHOES: "/giay", CLOTHING: "/quan-ao" };
export const GATEWAY_PATH = "/";

const PREFIXED = /^\/(giay|quan-ao)(?=\/|\?|#|$)/;

/** Splits "/quan-ao/san-pham/x?y" into { department: "CLOTHING", rest: "/san-pham/x?y" }.
 *  department is null when the path carries no store prefix. */
export function splitStorePrefix(path: string): { department: Department | null; rest: string } {
  const m = path.match(PREFIXED);
  if (!m) return { department: null, rest: path };
  const rest = path.slice(m[0].length);
  return {
    department: m[1] === "quan-ao" ? "CLOTHING" : "SHOES",
    rest: rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest,
  };
}

/** Where a store-agnostic internal href points inside `department`'s store.
 *  Idempotent: an href that already names a store is left alone, as are
 *  external links, anchors, and non-storefront routes (/admin, /api). */
export function storeHref(department: Department, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (/^\/(admin|api|_next)(\/|$)/.test(href)) return href;
  if (splitStorePrefix(href).department) return href;

  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const tail = cut === -1 ? "" : href.slice(cut);

  if (department === "CLOTHING") return `${STORE_PREFIX.CLOTHING}${path === "/" ? "" : path}${tail}`;
  // Shoes keep their original unprefixed URLs; only the homepage moved,
  // because "/" is the gateway now.
  return path === "/" ? `${STORE_PREFIX.SHOES}${tail}` : href;
}

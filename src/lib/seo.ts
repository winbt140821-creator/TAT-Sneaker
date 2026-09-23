import { routing } from "@/i18n/routing";
import type { Department } from "./inventory";
import { storeHref } from "./store-path";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

// Both stores share one domain now (see src/lib/store-path.ts); kept as a
// function so callers stay explicit about which store a URL belongs to.
export function siteUrlForDepartment(_department: Department): string {
  return SITE_URL;
}

/** Absolute URL of a store-agnostic path inside `department`'s store,
 *  e.g. ("/san-pham/x", "CLOTHING") → https://tatsneaker.vn/quan-ao/san-pham/x.
 *  Pass `null` for store-independent paths (the gateway, sitemap). */
export function absoluteUrl(path: string, department: Department | null = "SHOES"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${department ? storeHref(department, p) : p}`;
}

// "vi" (default locale) stays unprefixed per localePrefix: "as-needed" —
// mirrors the same rule next-intl's middleware applies at request time.
export function localizedUrl(path: string, locale: string, department: Department | null = "SHOES"): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const p = department ? storeHref(department, path) : path;
  return `${SITE_URL}${prefix}${p === "/" && prefix ? "" : p}`;
}

export function languageAlternates(
  path: string,
  department: Department | null = "SHOES"
): Record<string, string> {
  return Object.fromEntries(routing.locales.map((l) => [l, localizedUrl(path, l, department)]));
}

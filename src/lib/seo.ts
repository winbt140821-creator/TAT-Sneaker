import { routing } from "@/i18n/routing";
import type { Department } from "./inventory";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

// The clothing storefront has no domain env var of its own — it's always
// the "quanao." subdomain of whatever the shoe site's domain is, so this
// derives it rather than requiring a second env var to keep in sync.
// Falls back to the shoe URL if SITE_URL isn't a real absolute URL (e.g.
// local dev's default "http://localhost:3000" — there's no meaningful
// "quanao.localhost" to redirect to).
export function siteUrlForDepartment(department: Department): string {
  if (department === "SHOES") return SITE_URL;
  try {
    const url = new URL(SITE_URL);
    url.hostname = `quanao.${url.hostname}`;
    return url.toString().replace(/\/$/, "");
  } catch {
    return SITE_URL;
  }
}

export function absoluteUrl(path: string, department: Department = "SHOES"): string {
  return `${siteUrlForDepartment(department)}${path.startsWith("/") ? path : `/${path}`}`;
}

// "vi" (default locale) stays unprefixed per localePrefix: "as-needed" —
// mirrors the same rule next-intl's middleware applies at request time.
export function localizedUrl(path: string, locale: string, department: Department = "SHOES"): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${siteUrlForDepartment(department)}${prefix}${path}`;
}

export function languageAlternates(
  path: string,
  department: Department = "SHOES"
): Record<string, string> {
  return Object.fromEntries(routing.locales.map((l) => [l, localizedUrl(path, l, department)]));
}

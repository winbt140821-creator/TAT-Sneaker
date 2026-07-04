import { getLocale } from "next-intl/server";
import { getSiteSettings } from "./settings";
import { formatPriceForLocale } from "./currency";

// Server Component convenience wrapper — reads the current locale and site
// settings itself instead of the caller threading them through. Kept in a
// separate module from the pure formatPriceForLocale() so Client Components
// can import that one without pulling in server-only DB code (Prisma/
// better-sqlite3 can't be bundled for the browser).
export async function formatPriceForCurrentLocale(vnd: number): Promise<string> {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);
  return formatPriceForLocale(vnd, locale, settings ?? {});
}

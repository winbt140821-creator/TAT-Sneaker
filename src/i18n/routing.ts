import { defineRouting } from "next-intl/routing";

// "vi" stays unprefixed (localePrefix: "as-needed") so today's Vietnamese
// URLs, bookmarks, and any already-indexed Google links keep working
// unchanged — only /en and /zh get a path prefix.
export const routing = defineRouting({
  locales: ["vi", "en", "zh"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
  // next-intl's automatic hreflang `Link` response header is computed from
  // the store-less path the proxy hands it (see src/proxy.ts), so for
  // /quan-ao/… and the gateway it would advertise the wrong URLs. Every page
  // already declares its own alternates in metadata instead.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

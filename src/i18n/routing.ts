import { defineRouting } from "next-intl/routing";

// "vi" stays unprefixed (localePrefix: "as-needed") so today's Vietnamese
// URLs, bookmarks, and any already-indexed Google links keep working
// unchanged — only /en and /zh get a path prefix.
export const routing = defineRouting({
  locales: ["vi", "en", "zh"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

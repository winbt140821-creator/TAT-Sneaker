import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";

// Every admin mutation that touches SiteSettings already calls
// revalidatePath("/") (see admin/settings/actions.ts) — that busts this
// entry too, since revalidatePath invalidates any cache read while
// rendering that path, not just page output. Read volume is the whole
// reason this is cached: this function is awaited on literally every
// storefront page (root layout, header, footer...), and with zero caching
// each of those was a fresh round trip to Turso — the thing that blew
// through the free-tier row-read quota and took the whole site down.
const fetchSiteSettings = unstable_cache(
  () => prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] }
);

// cache() on top dedupes concurrent calls within a single request (e.g.
// generateMetadata + the page body both call this); unstable_cache below it
// is what actually persists the result across different requests/visitors.
// Every caller already treats the result as nullable, so on a DB outage we
// degrade to null (site renders with defaults) instead of crashing the
// whole page via the root layout, which awaits this before rendering
// anything.
export const getSiteSettings = cache(async () => {
  try {
    return await fetchSiteSettings();
  } catch (err) {
    console.error("getSiteSettings failed, falling back to null:", err);
    return null;
  }
});

export const getSocialLinks = unstable_cache(
  (onlyEnabled = true) =>
    prisma.socialLink.findMany({
      where: onlyEnabled ? { enabled: true } : {},
      orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
    }),
  ["social-links"],
  { revalidate: 60, tags: ["social-links"] }
);

/** Maps raw SiteSettings rows into the shape <Hero> expects, so both the
 *  filtered and unfiltered homepage branches can just spread the result. */
export function heroPropsFromSettings(settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  const stats = [
    { value: settings?.heroStat1Value, label: settings?.heroStat1Label },
    { value: settings?.heroStat2Value, label: settings?.heroStat2Label },
    { value: settings?.heroStat3Value, label: settings?.heroStat3Label },
  ].filter((s): s is { value: string; label: string } => Boolean(s.value && s.label));

  const parsedImages: string[] = settings?.heroImages ? JSON.parse(settings.heroImages) : [];
  const coverImages = parsedImages.length > 0
    ? parsedImages
    : settings?.heroImageUrl
      ? [settings.heroImageUrl]
      : [];

  return {
    coverImages,
    eyebrow: settings?.heroEyebrow,
    eyebrowEnabled: settings?.heroEyebrowEnabled ?? true,
    heading: settings?.heroHeading,
    headingEnabled: settings?.heroHeadingEnabled ?? true,
    description: settings?.heroDescription,
    descriptionEnabled: settings?.heroDescriptionEnabled ?? true,
    statsEnabled: settings?.heroStatsEnabled ?? true,
    stats: stats.length > 0 ? stats : undefined,
  };
}

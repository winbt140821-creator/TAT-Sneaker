import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import type { Department } from "./inventory";
import { site, defaultContactEmail } from "./site-config";

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

// Per-storefront logo/hero — the one part of SiteSettings that the shoe and
// clothing sites can't share (see prisma/schema.prisma's StorefrontBranding
// model). Same cache() + unstable_cache layering as getSiteSettings above,
// and for the same reason: this is awaited on every storefront page.
// department is included in the unstable_cache args, so each storefront gets
// its own 60s cache entry.
const fetchBranding = unstable_cache(
  (department: Department) => prisma.storefrontBranding.findUnique({ where: { department } }),
  ["storefront-branding"],
  { revalidate: 60, tags: ["storefront-branding"] }
);

export const getBranding = cache(async (department: Department) => {
  try {
    return await fetchBranding(department);
  } catch (err) {
    console.error("getBranding failed, falling back to null:", err);
    return null;
  }
});

// A store's footer icons / quick-contact links: its own plus the ones set
// for both stores (department null).
export const getSocialLinks = unstable_cache(
  (department: Department) =>
    prisma.socialLink.findMany({
      where: { enabled: true, OR: [{ department: null }, { department }] },
      orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
    }),
  ["social-links-by-store"],
  { revalidate: 60, tags: ["social-links"] }
);

/** The contact details a store shows (footer, "Liên hệ" page, structured
 *  data), with the site-wide defaults filling in a missing phone/email. */
export function storeContact(branding: Awaited<ReturnType<typeof getBranding>>) {
  return {
    address: branding?.address ?? null,
    phone: branding?.phone || site.hotline,
    email: branding?.email || defaultContactEmail,
    footerAbout: branding?.footerAbout ?? null,
  };
}

/** Maps a raw StorefrontBranding row into the shape <Hero> expects, so both
 *  the filtered and unfiltered homepage branches can just spread the result. */
export function heroPropsFromSettings(branding: Awaited<ReturnType<typeof getBranding>>) {
  const stats = [
    { value: branding?.heroStat1Value, label: branding?.heroStat1Label },
    { value: branding?.heroStat2Value, label: branding?.heroStat2Label },
    { value: branding?.heroStat3Value, label: branding?.heroStat3Label },
  ].filter((s): s is { value: string; label: string } => Boolean(s.value && s.label));

  const parsedImages: string[] = branding?.heroImages ? JSON.parse(branding.heroImages) : [];
  const coverImages = parsedImages.length > 0
    ? parsedImages
    : branding?.heroImageUrl
      ? [branding.heroImageUrl]
      : [];

  return {
    coverImages,
    eyebrow: branding?.heroEyebrow,
    eyebrowEnabled: branding?.heroEyebrowEnabled ?? true,
    heading: branding?.heroHeading,
    headingEnabled: branding?.heroHeadingEnabled ?? true,
    description: branding?.heroDescription,
    descriptionEnabled: branding?.heroDescriptionEnabled ?? true,
    statsEnabled: branding?.heroStatsEnabled ?? true,
    stats: stats.length > 0 ? stats : undefined,
  };
}

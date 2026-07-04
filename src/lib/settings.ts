import { cache } from "react";
import { prisma } from "./db";

// Cached per-request — Header, Footer, and page components each call this
// independently, so dedupe to a single query per request.
export const getSiteSettings = cache(() => {
  return prisma.siteSettings.findUnique({ where: { id: "singleton" } });
});

export async function getSocialLinks(onlyEnabled = true) {
  return prisma.socialLink.findMany({
    where: onlyEnabled ? { enabled: true } : {},
    orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
  });
}

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

-- Data-only migration: carry the existing shoe site's logo/hero look over
-- into the new per-department StorefrontBranding table, so the storefront
-- renders byte-for-byte the same once app code switches from reading
-- SiteSettings' hero/logo fields to reading StorefrontBranding. Guarded by
-- NOT EXISTS so it's a no-op (and safe to re-run) if a SHOES row somehow
-- already exists.
INSERT INTO "StorefrontBranding" (
  "department", "logoUrl", "heroImageUrl", "heroImages",
  "heroEyebrow", "heroEyebrowEnabled", "heroHeading", "heroHeadingEnabled",
  "heroDescription", "heroDescriptionEnabled", "heroStatsEnabled",
  "heroStat1Value", "heroStat1Label", "heroStat2Value", "heroStat2Label",
  "heroStat3Value", "heroStat3Label", "updatedAt"
)
SELECT
  'SHOES', "logoUrl", "heroImageUrl", "heroImages",
  "heroEyebrow", "heroEyebrowEnabled", "heroHeading", "heroHeadingEnabled",
  "heroDescription", "heroDescriptionEnabled", "heroStatsEnabled",
  "heroStat1Value", "heroStat1Label", "heroStat2Value", "heroStat2Label",
  "heroStat3Value", "heroStat3Label", CURRENT_TIMESTAMP
FROM "SiteSettings"
WHERE "id" = 'singleton'
  AND NOT EXISTS (SELECT 1 FROM "StorefrontBranding" WHERE "department" = 'SHOES');

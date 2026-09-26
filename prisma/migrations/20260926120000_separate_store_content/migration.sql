-- Gives the clothing store its own news, reviews, content pages, social
-- links/pages and contact copy, instead of sharing the shoe store's.
--
-- Plain ADD COLUMN / index statements only — no table rebuilds — for the
-- same reason as 20260922201609: prisma/deploy-turso.ts replays this file
-- over the network with no transaction around it. Every existing row keeps
-- showing where it does today: content rows default to the shoe store, and
-- social links/pages default to null (= both stores).

ALTER TABLE "NewsArticle" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'SHOES';
ALTER TABLE "Testimonial" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'SHOES';
ALTER TABLE "StaticPage" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'SHOES';
ALTER TABLE "SocialLink" ADD COLUMN "department" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN "department" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "department" TEXT;

ALTER TABLE "StorefrontBranding" ADD COLUMN "address" TEXT;
ALTER TABLE "StorefrontBranding" ADD COLUMN "phone" TEXT;
ALTER TABLE "StorefrontBranding" ADD COLUMN "email" TEXT;
ALTER TABLE "StorefrontBranding" ADD COLUMN "footerAbout" TEXT;
ALTER TABLE "StorefrontBranding" ADD COLUMN "defaultProductDescription" TEXT;
ALTER TABLE "StorefrontBranding" ADD COLUMN "socialPostTemplate" TEXT;

-- A page slug is now unique per store rather than site-wide.
DROP INDEX "StaticPage_slug_key";
CREATE UNIQUE INDEX "StaticPage_slug_department_key" ON "StaticPage"("slug", "department");

CREATE INDEX "NewsArticle_department_idx" ON "NewsArticle"("department");
CREATE INDEX "Testimonial_department_idx" ON "Testimonial"("department");

-- Data: one branding row per store, then carry the shared contact details,
-- product description and post template over to both, so both sites render
-- exactly as before. The footer blurb was written for the shoe shop (the
-- clothing footer never showed it), so it goes to the shoe store only.
INSERT INTO "StorefrontBranding" ("department", "updatedAt")
SELECT 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StorefrontBranding" WHERE "department" = 'SHOES');

INSERT INTO "StorefrontBranding" ("department", "updatedAt")
SELECT 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StorefrontBranding" WHERE "department" = 'CLOTHING');

UPDATE "StorefrontBranding" SET
  "address" = (SELECT "address" FROM "SiteSettings" WHERE "id" = 'singleton'),
  "phone" = (SELECT "phone" FROM "SiteSettings" WHERE "id" = 'singleton'),
  "email" = (SELECT "email" FROM "SiteSettings" WHERE "id" = 'singleton'),
  "defaultProductDescription" = (SELECT "defaultProductDescription" FROM "SiteSettings" WHERE "id" = 'singleton'),
  "socialPostTemplate" = (SELECT "socialPostTemplate" FROM "SiteSettings" WHERE "id" = 'singleton');

UPDATE "StorefrontBranding" SET
  "footerAbout" = (SELECT "footerAbout" FROM "SiteSettings" WHERE "id" = 'singleton')
WHERE "department" = 'SHOES';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "sizeLabel" TEXT;

-- CreateTable
CREATE TABLE "StorefrontBranding" (
    "department" TEXT NOT NULL PRIMARY KEY,
    "logoUrl" TEXT,
    "heroImageUrl" TEXT,
    "heroImages" TEXT,
    "heroEyebrow" TEXT,
    "heroEyebrowEnabled" BOOLEAN NOT NULL DEFAULT true,
    "heroHeading" TEXT,
    "heroHeadingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "heroDescription" TEXT,
    "heroDescriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "heroStatsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "heroStat1Value" TEXT,
    "heroStat1Label" TEXT,
    "heroStat2Value" TEXT,
    "heroStat2Label" TEXT,
    "heroStat3Value" TEXT,
    "heroStat3Label" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- AlterTable: plain ADD COLUMN instead of Prisma's default table-rebuild
-- (CREATE new_table / INSERT SELECT / DROP / RENAME) — SQLite fully supports
-- adding a NOT NULL column with a literal DEFAULT without rewriting the
-- table. Category and Product carry real, hard-to-recreate production data,
-- and this app's Turso deploy step (prisma/deploy-turso.ts) applies each
-- migration.sql over the network with no transaction wrapping it — a
-- dropped-then-half-restored table from an interrupted rebuild is a much
-- worse failure mode than a plain ADD COLUMN, which is a single atomic
-- statement with nothing to roll back to.
ALTER TABLE "Category" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'SHOES';
CREATE INDEX "Category_department_idx" ON "Category"("department");

ALTER TABLE "Product" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'SHOES';
CREATE INDEX "Product_department_idx" ON "Product"("department");

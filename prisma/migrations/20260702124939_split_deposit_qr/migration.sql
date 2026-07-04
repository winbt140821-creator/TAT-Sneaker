/*
  Warnings:

  - You are about to drop the column `depositQrUrl` on the `SiteSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "heroImageUrl" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "footerAbout" TEXT,
    "vnpayQrUrl" TEXT,
    "paypalQrUrl" TEXT,
    "usdExchangeRate" INTEGER,
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
INSERT INTO "new_SiteSettings" ("address", "email", "footerAbout", "heroDescription", "heroDescriptionEnabled", "heroEyebrow", "heroEyebrowEnabled", "heroHeading", "heroHeadingEnabled", "heroImageUrl", "heroStat1Label", "heroStat1Value", "heroStat2Label", "heroStat2Value", "heroStat3Label", "heroStat3Value", "heroStatsEnabled", "id", "phone", "updatedAt", "usdExchangeRate") SELECT "address", "email", "footerAbout", "heroDescription", "heroDescriptionEnabled", "heroEyebrow", "heroEyebrowEnabled", "heroHeading", "heroHeadingEnabled", "heroImageUrl", "heroStat1Label", "heroStat1Value", "heroStat2Label", "heroStat2Value", "heroStat3Label", "heroStat3Value", "heroStatsEnabled", "id", "phone", "updatedAt", "usdExchangeRate" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

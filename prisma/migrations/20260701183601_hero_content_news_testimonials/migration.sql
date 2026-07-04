-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
INSERT INTO "new_SiteSettings" ("address", "email", "footerAbout", "heroImageUrl", "id", "phone", "updatedAt") SELECT "address", "email", "footerAbout", "heroImageUrl", "id", "phone", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

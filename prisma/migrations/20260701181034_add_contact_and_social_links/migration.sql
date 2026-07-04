-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "address" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "email" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "footerAbout" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

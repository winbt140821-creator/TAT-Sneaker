-- AlterTable
ALTER TABLE "Product" ADD COLUMN "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "heroImageUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

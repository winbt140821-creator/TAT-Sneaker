-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "Product_sourceUrl_idx" ON "Product"("sourceUrl");

-- CreateTable
CREATE TABLE "ImportSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "password" TEXT,
    "department" TEXT NOT NULL DEFAULT 'CLOTHING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportSource_owner_key" ON "ImportSource"("owner");

-- CreateTable
CREATE TABLE "SaleCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_SaleCampaignProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SaleCampaignProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SaleCampaignProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "SaleCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "costPrice" INTEGER,
    "condition" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "accent" TEXT NOT NULL DEFAULT '#4a4638',
    "sizeQuantities" TEXT NOT NULL DEFAULT '{}',
    "images" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" INTEGER,
    "availability" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "leadTimeMinDays" INTEGER NOT NULL DEFAULT 3,
    "leadTimeMaxDays" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("accent", "availability", "condition", "costPrice", "createdAt", "depositAmount", "depositRequired", "id", "images", "leadTimeMaxDays", "leadTimeMinDays", "name", "price", "sizeQuantities", "sku", "updatedAt", "verified", "videoUrl") SELECT "accent", "availability", "condition", "costPrice", "createdAt", "depositAmount", "depositRequired", "id", "images", "leadTimeMaxDays", "leadTimeMinDays", "name", "price", "sizeQuantities", "sku", "updatedAt", "verified", "videoUrl" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_SaleCampaignProducts_AB_unique" ON "_SaleCampaignProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_SaleCampaignProducts_B_index" ON "_SaleCampaignProducts"("B");


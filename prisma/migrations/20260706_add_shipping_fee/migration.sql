-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "costPrice" INTEGER,
    "quality" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT '#4a4638',
    "sizeQuantities" TEXT NOT NULL DEFAULT '{}',
    "images" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" INTEGER,
    "availability" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "leadTimeMinDays" INTEGER NOT NULL DEFAULT 3,
    "leadTimeMaxDays" INTEGER NOT NULL DEFAULT 5,
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("accent", "availability", "costPrice", "createdAt", "depositAmount", "depositRequired", "id", "images", "leadTimeMaxDays", "leadTimeMinDays", "name", "price", "quality", "sizeQuantities", "sku", "updatedAt", "videoUrl") SELECT "accent", "availability", "costPrice", "createdAt", "depositAmount", "depositRequired", "id", "images", "leadTimeMaxDays", "leadTimeMinDays", "name", "price", "quality", "sizeQuantities", "sku", "updatedAt", "videoUrl" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


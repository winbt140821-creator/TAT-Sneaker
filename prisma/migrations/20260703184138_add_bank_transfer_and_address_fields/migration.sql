-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "bankAccountHolder" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "bankAccountNumber" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "bankName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "bankTransferQrUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "province" TEXT,
    "ward" TEXT,
    "address" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerId" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "trackingCode" TEXT,
    "shippingStatus" TEXT,
    "shippingSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "code", "createdAt", "customerId", "customerName", "customerPhone", "depositAmount", "depositPaid", "id", "note", "shippingStatus", "shippingSyncedAt", "status", "trackingCode", "updatedAt") SELECT "address", "code", "createdAt", "customerId", "customerName", "customerPhone", "depositAmount", "depositPaid", "id", "note", "shippingStatus", "shippingSyncedAt", "status", "trackingCode", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

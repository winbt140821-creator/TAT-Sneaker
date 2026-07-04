-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shippingStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingSyncedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "trackingCode" TEXT;

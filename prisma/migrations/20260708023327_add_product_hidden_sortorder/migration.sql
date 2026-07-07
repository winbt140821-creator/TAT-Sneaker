-- AlterTable
ALTER TABLE "Product" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill sortOrder so the initial manual order matches what's already on
-- screen (newest first, same as the current default) instead of reshuffling
-- everything to 0 on deploy — the newest product gets sortOrder 0, and each
-- older product gets the count of products newer than it.
UPDATE "Product"
SET "sortOrder" = (
  SELECT COUNT(*) FROM "Product" AS p2 WHERE p2."createdAt" > "Product"."createdAt"
);

-- CreateIndex
CREATE INDEX "Product_hidden_idx" ON "Product"("hidden");

-- CreateIndex
CREATE INDEX "Product_sortOrder_idx" ON "Product"("sortOrder");

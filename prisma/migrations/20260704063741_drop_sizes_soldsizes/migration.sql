-- Drop legacy sizes/soldSizes columns now that sizeQuantities has been
-- backfilled with equivalent data.
ALTER TABLE "Product" DROP COLUMN "sizes";
ALTER TABLE "Product" DROP COLUMN "soldSizes";

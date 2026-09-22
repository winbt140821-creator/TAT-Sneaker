-- Data-only migration: populate the new sizeLabel column from the legacy
-- numeric `size` column for every pre-existing OrderItem row, so admin order
-- views and any future code reading sizeLabel see the shoe size ("36", "42",
-- ...) for historical orders instead of NULL. Idempotent (WHERE sizeLabel IS
-- NULL) and safe to re-run if this migration is ever replayed.
UPDATE "OrderItem" SET "sizeLabel" = CAST("size" AS TEXT) WHERE "sizeLabel" IS NULL;

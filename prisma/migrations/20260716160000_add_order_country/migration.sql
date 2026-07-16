-- Adds an optional-in-spirit country snapshot to Order, defaulting to the
-- domestic value so every existing row stays "Việt Nam" without a backfill.
-- International orders (no province/ward) store the customer-typed country
-- name here instead.
ALTER TABLE "Order" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Việt Nam';

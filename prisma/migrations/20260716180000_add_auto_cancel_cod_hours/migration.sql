-- Backstop for the guest-checkout stock-lock abuse vector: plain COD orders
-- (no deposit) currently never get swept by autoCancelStaleOrders, so a
-- spammed COD order permanently drains stock until staff manually cancels
-- it. Null keeps the sweep disabled, same as the existing deposit column.
ALTER TABLE "SiteSettings" ADD COLUMN "autoCancelUnpaidCodHours" INTEGER;

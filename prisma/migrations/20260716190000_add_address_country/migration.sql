-- Mirrors Order.country (see 20260716160000_add_order_country) so the
-- saved address book can hold international addresses too, not just the
-- one-off ones typed at checkout.
ALTER TABLE "Address" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Việt Nam';

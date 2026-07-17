-- USD/CNY rates now come from a live FX API (src/lib/fx.ts) instead of an
-- admin-typed value, so these columns are no longer read or written anywhere.
ALTER TABLE "SiteSettings" DROP COLUMN "usdExchangeRate";
ALTER TABLE "SiteSettings" DROP COLUMN "cnyExchangeRate";

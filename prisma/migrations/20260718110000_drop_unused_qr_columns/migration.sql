-- Neither column was ever read outside the admin settings page that wrote
-- them: VNPay stays hidden from checkout entirely, and PayPal now uses the
-- real Orders API redirect flow instead of a static scan-to-pay QR image.
ALTER TABLE "SiteSettings" DROP COLUMN "vnpayQrUrl";
ALTER TABLE "SiteSettings" DROP COLUMN "paypalQrUrl";

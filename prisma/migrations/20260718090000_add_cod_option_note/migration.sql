-- Admin-editable override for the COD payment option's title/description at
-- checkout, so policy wording (deposit %, Zalo contact, refund terms) is
-- authored by the shop owner in Settings instead of hardcoded.
ALTER TABLE "SiteSettings" ADD COLUMN "codOptionTitle" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "codOptionNote" TEXT;

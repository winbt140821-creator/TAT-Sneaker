-- Structured phone number (separate from the free-text codOptionNote) so a
-- tap-to-chat zalo.me link can be generated instead of just showing digits.
ALTER TABLE "SiteSettings" ADD COLUMN "codOptionZaloPhone" TEXT;

-- The clothing store's social-post template was copied from the shoe
-- store's when the stores were separated, and still offered to order "các
-- mẫu giày". (Matched as stored: the text uses decomposed accents.) Reword that one line — only while staff haven't edited the
-- clothing template themselves (it still equals the shared original).
UPDATE "StorefrontBranding"
SET "socialPostTemplate" = REPLACE("socialPostTemplate", 'mẫu giày', 'mẫu quần áo')
WHERE "department" = 'CLOTHING'
  AND "socialPostTemplate" = (SELECT "socialPostTemplate" FROM "SiteSettings" WHERE "id" = 'singleton');

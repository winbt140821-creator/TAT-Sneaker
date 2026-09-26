-- Starter categories for the clothing store, which had none — its menu and
-- category pages were empty. Only added while the clothing store has no
-- categories of its own (ids starting "clothingcat_" are this migration's),
-- so a structure staff already made is never mixed with this one; safe to
-- replay. Categories with nothing on sale stay out of the menu until they
-- have products (see getNavCategories), so unused ones cost nothing.
--
-- Clothing products that have no category yet are filed by the garment
-- their name starts with — the import tool names products that way
-- ("Áo khoác bóng chày …").

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_ao_thun', 'Áo thun & Polo', 'ao-thun', 0, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'ao-thun')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_ao_so_mi', 'Áo sơ mi', 'ao-so-mi', 1, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'ao-so-mi')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_ao_len_hoodie', 'Hoodie & Áo len', 'ao-len-hoodie', 2, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'ao-len-hoodie')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_ao_khoac', 'Áo khoác', 'ao-khoac', 3, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'ao-khoac')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_quan', 'Quần', 'quan', 4, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'quan')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_vay_dam', 'Váy & Đầm', 'vay-dam', 5, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'vay-dam')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "Category" ("id", "label", "slug", "sortOrder", "department", "createdAt")
SELECT 'clothingcat_phu_kien', 'Phụ kiện', 'phu-kien', 6, 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'phu-kien')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "department" = 'CLOTHING' AND "id" NOT LIKE 'clothingcat_%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_ao_thun', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_ao_thun')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Áo thun%' OR "name" LIKE 'áo thun%' OR "name" LIKE 'Áo polo%' OR "name" LIKE 'áo polo%' OR "name" LIKE 'Áo ba lỗ%' OR "name" LIKE 'áo ba lỗ%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_ao_so_mi', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_ao_so_mi')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Áo sơ mi%' OR "name" LIKE 'áo sơ mi%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_ao_len_hoodie', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_ao_len_hoodie')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Áo hoodie%' OR "name" LIKE 'áo hoodie%' OR "name" LIKE 'Áo nỉ%' OR "name" LIKE 'áo nỉ%' OR "name" LIKE 'Áo len%' OR "name" LIKE 'áo len%' OR "name" LIKE 'Áo cardigan%' OR "name" LIKE 'áo cardigan%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_ao_khoac', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_ao_khoac')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Áo khoác%' OR "name" LIKE 'áo khoác%' OR "name" LIKE 'Áo jacket%' OR "name" LIKE 'áo jacket%' OR "name" LIKE 'Áo bomber%' OR "name" LIKE 'áo bomber%' OR "name" LIKE 'Áo phao%' OR "name" LIKE 'áo phao%' OR "name" LIKE 'Áo măng tô%' OR "name" LIKE 'áo măng tô%' OR "name" LIKE 'Áo gile%' OR "name" LIKE 'áo gile%' OR "name" LIKE 'Áo vest%' OR "name" LIKE 'áo vest%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_quan', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_quan')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Quần%' OR "name" LIKE 'quần%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_vay_dam', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_vay_dam')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Váy%' OR "name" LIKE 'váy%' OR "name" LIKE 'Chân váy%' OR "name" LIKE 'chân váy%' OR "name" LIKE 'Đầm%' OR "name" LIKE 'đầm%');

INSERT INTO "_ProductCategories" ("A", "B")
SELECT 'clothingcat_phu_kien', "id" FROM "Product"
WHERE "department" = 'CLOTHING'
  AND EXISTS (SELECT 1 FROM "Category" WHERE "id" = 'clothingcat_phu_kien')
  AND NOT EXISTS (SELECT 1 FROM "_ProductCategories" WHERE "B" = "Product"."id")
  AND ("name" LIKE 'Mũ%' OR "name" LIKE 'mũ%' OR "name" LIKE 'Túi%' OR "name" LIKE 'túi%' OR "name" LIKE 'Balo%' OR "name" LIKE 'balo%' OR "name" LIKE 'Ví%' OR "name" LIKE 'ví%' OR "name" LIKE 'Thắt lưng%' OR "name" LIKE 'thắt lưng%' OR "name" LIKE 'Khăn%' OR "name" LIKE 'khăn%' OR "name" LIKE 'Tất%' OR "name" LIKE 'tất%');

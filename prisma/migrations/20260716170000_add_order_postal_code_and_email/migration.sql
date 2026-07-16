-- International orders need a postal code (domestic shipping never uses
-- one), and guest checkout needs a contact email snapshot on the order
-- itself since guest orders have no Customer row to read it from.
ALTER TABLE "Order" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "email" TEXT;

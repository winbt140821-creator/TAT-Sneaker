-- CreateTable
CREATE TABLE "SizeChartRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "vnSize" TEXT NOT NULL,
    "usSize" TEXT NOT NULL,
    "ukSize" TEXT NOT NULL,
    "cmSize" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SizeChartRow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

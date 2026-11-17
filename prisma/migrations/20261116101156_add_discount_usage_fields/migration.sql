-- AlterTable
ALTER TABLE "Discount" ADD COLUMN     "maxDiscountAmount" INTEGER,
ADD COLUMN     "usageLimit" INTEGER,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountCode" TEXT;

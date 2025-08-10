/*
  Warnings:

  - You are about to drop the `AccommodationSale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransferSale` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TransferSale" DROP CONSTRAINT "TransferSale_transferId_fkey";

-- DropTable
DROP TABLE "AccommodationSale";

-- DropTable
DROP TABLE "TransferSale";

-- DropEnum
DROP TYPE "AccommodationSaleStatus";

-- DropEnum
DROP TYPE "TransferSaleStatus";

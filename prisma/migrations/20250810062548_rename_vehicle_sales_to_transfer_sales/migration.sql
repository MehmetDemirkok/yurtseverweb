/*
  Warnings:

  - You are about to drop the `VehicleSale` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransferSaleStatus" AS ENUM ('BEKLEMEDE', 'TAMAMLANDI', 'IPTAL');

-- DropForeignKey
ALTER TABLE "VehicleSale" DROP CONSTRAINT "VehicleSale_aracId_fkey";

-- DropTable
DROP TABLE "VehicleSale";

-- DropEnum
DROP TYPE "VehicleSaleStatus";

-- CreateTable
CREATE TABLE "TransferSale" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "musteriAdi" TEXT NOT NULL,
    "musteriTelefon" TEXT NOT NULL,
    "yolcuSayisi" INTEGER NOT NULL,
    "satisFiyati" DOUBLE PRECISION NOT NULL,
    "satisTarihi" TEXT NOT NULL,
    "durum" "TransferSaleStatus" NOT NULL DEFAULT 'BEKLEMEDE',
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransferSale" ADD CONSTRAINT "TransferSale_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

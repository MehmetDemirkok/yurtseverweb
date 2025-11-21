/*
  Warnings:

  - You are about to drop the `Arac` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AracBakim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cari` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sofor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tedarikci` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Yolcu` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Accommodation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SaleFaturaStatus" AS ENUM ('BEKLIYOR', 'KESILDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "public"."SalePaymentStatus" AS ENUM ('ODENMEDI', 'KISMI_ODENDI', 'ODENDI');

-- DropForeignKey
ALTER TABLE "public"."Arac" DROP CONSTRAINT "Arac_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AracBakim" DROP CONSTRAINT "AracBakim_aracId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AracBakim" DROP CONSTRAINT "AracBakim_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AracBakim" DROP CONSTRAINT "AracBakim_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cari" DROP CONSTRAINT "Cari_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sofor" DROP CONSTRAINT "Sofor_atananAracId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sofor" DROP CONSTRAINT "Sofor_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tedarikci" DROP CONSTRAINT "Tedarikci_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_aracId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_cariId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_soforId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_tedarikciId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Yolcu" DROP CONSTRAINT "Yolcu_transferId_fkey";

-- AlterTable
ALTER TABLE "public"."Accommodation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isTransferred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."Arac";

-- DropTable
DROP TABLE "public"."AracBakim";

-- DropTable
DROP TABLE "public"."Cari";

-- DropTable
DROP TABLE "public"."Sofor";

-- DropTable
DROP TABLE "public"."Tedarikci";

-- DropTable
DROP TABLE "public"."Transfer";

-- DropTable
DROP TABLE "public"."Yolcu";

-- DropEnum
DROP TYPE "public"."AracBakimDurum";

-- DropEnum
DROP TYPE "public"."AracBakimTipi";

-- DropEnum
DROP TYPE "public"."AracDurum";

-- DropEnum
DROP TYPE "public"."AracTipi";

-- DropEnum
DROP TYPE "public"."CariDurum";

-- DropEnum
DROP TYPE "public"."CariTip";

-- DropEnum
DROP TYPE "public"."SoforDurum";

-- DropEnum
DROP TYPE "public"."TedarikciDurum";

-- DropEnum
DROP TYPE "public"."TransferDurum";

-- CreateTable
CREATE TABLE "public"."AccommodationSale" (
    "id" SERIAL NOT NULL,
    "accommodationId" INTEGER NOT NULL,
    "adiSoyadi" TEXT NOT NULL,
    "unvani" TEXT NOT NULL,
    "ulke" TEXT NOT NULL,
    "sehir" TEXT NOT NULL,
    "girisTarihi" TEXT NOT NULL,
    "cikisTarihi" TEXT NOT NULL,
    "odaTipi" TEXT NOT NULL,
    "konaklamaTipi" TEXT NOT NULL,
    "otelAdi" TEXT,
    "alisFiyati" DOUBLE PRECISION NOT NULL,
    "toplamAlisFiyati" DOUBLE PRECISION NOT NULL,
    "satisFiyati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toplamSatisFiyati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "karOrani" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "musteriAdi" TEXT,
    "musteriCariKodu" TEXT,
    "faturaDurumu" "public"."SaleFaturaStatus" NOT NULL DEFAULT 'BEKLIYOR',
    "odemeDurumu" "public"."SalePaymentStatus" NOT NULL DEFAULT 'ODENMEDI',
    "notlar" TEXT,
    "odenenTutar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kalanTutar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "AccommodationSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AccommodationSale" ADD CONSTRAINT "AccommodationSale_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "public"."Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccommodationSale" ADD CONSTRAINT "AccommodationSale_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

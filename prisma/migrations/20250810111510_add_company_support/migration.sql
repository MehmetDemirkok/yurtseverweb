/*
  Warnings:

  - A unique constraint covering the columns `[plaka,companyId]` on the table `Arac` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telefon,companyId]` on the table `Sofor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Arac` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Cari` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Sofor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Tedarikci` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."HotelDurum" AS ENUM ('AKTIF', 'PASIF', 'TAMAMEN_DOLU', 'BAKIM');

-- DropIndex
DROP INDEX "public"."Arac_plaka_key";

-- DropIndex
DROP INDEX "public"."Sofor_telefon_key";

-- AlterTable
ALTER TABLE "public"."Accommodation" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Arac" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Cari" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Log" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sofor" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Tedarikci" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Transfer" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Türkiye',
    "taxNumber" TEXT,
    "taxOffice" TEXT,
    "logo" TEXT,
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Hotel" (
    "id" SERIAL NOT NULL,
    "adi" TEXT NOT NULL,
    "adres" TEXT NOT NULL,
    "sehir" TEXT NOT NULL,
    "ulke" TEXT NOT NULL,
    "telefon" TEXT,
    "email" TEXT,
    "website" TEXT,
    "yildizSayisi" INTEGER NOT NULL DEFAULT 0,
    "puan" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "aciklama" TEXT,
    "durum" "public"."HotelDurum" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "public"."Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Arac_plaka_companyId_key" ON "public"."Arac"("plaka", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Sofor_telefon_companyId_key" ON "public"."Sofor"("telefon", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_companyId_key" ON "public"."User"("email", "companyId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Accommodation" ADD CONSTRAINT "Accommodation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Hotel" ADD CONSTRAINT "Hotel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arac" ADD CONSTRAINT "Arac_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sofor" ADD CONSTRAINT "Sofor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transfer" ADD CONSTRAINT "Transfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cari" ADD CONSTRAINT "Cari_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tedarikci" ADD CONSTRAINT "Tedarikci_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

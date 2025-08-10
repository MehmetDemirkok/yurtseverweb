/*
  Warnings:

  - You are about to drop the column `islemAciklamasi` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `islemTarihi` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `islemTipi` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `islemTutari` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `satisDurumu` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `satisFiyati` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `satisTarihi` on the `Accommodation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Accommodation" DROP COLUMN "islemAciklamasi",
DROP COLUMN "islemTarihi",
DROP COLUMN "islemTipi",
DROP COLUMN "islemTutari",
DROP COLUMN "satisDurumu",
DROP COLUMN "satisFiyati",
DROP COLUMN "satisTarihi";

-- DropEnum
DROP TYPE "SaleStatus";

-- DropEnum
DROP TYPE "TransactionType";

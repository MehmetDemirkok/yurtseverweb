/*
  Warnings:

  - You are about to drop the `Sale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_accommodationId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "islemAciklamasi" TEXT,
ADD COLUMN     "islemTarihi" TEXT,
ADD COLUMN     "islemTipi" "TransactionType",
ADD COLUMN     "islemTutari" DOUBLE PRECISION,
ADD COLUMN     "satisDurumu" "SaleStatus" DEFAULT 'AKTARILDI',
ADD COLUMN     "satisFiyati" DOUBLE PRECISION,
ADD COLUMN     "satisTarihi" TIMESTAMP(3);

-- DropTable
DROP TABLE "Sale";

-- DropTable
DROP TABLE "Transaction";

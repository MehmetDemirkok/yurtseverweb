-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "fiyat" DOUBLE PRECISION,
ADD COLUMN     "tahsisli" BOOLEAN NOT NULL DEFAULT false;

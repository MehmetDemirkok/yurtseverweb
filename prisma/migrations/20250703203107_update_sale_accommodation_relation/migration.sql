-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_accommodationId_fkey";

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "accommodationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

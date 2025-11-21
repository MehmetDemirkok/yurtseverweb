/*
  Warnings:

  - You are about to drop the column `userId` on the `Sale` table. All the data in the column will be lost.
  - Added the required column `accommodationId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "userId",
ADD COLUMN     "accommodationId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

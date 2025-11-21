/*
  Warnings:

  - You are about to drop the column `adminId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `companyAdmin` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Company" DROP CONSTRAINT "Company_adminId_fkey";

-- DropIndex
DROP INDEX "public"."Company_adminId_key";

-- AlterTable
ALTER TABLE "public"."Arac" ADD COLUMN     "arventoData" JSONB,
ADD COLUMN     "arventoId" TEXT;

-- AlterTable
ALTER TABLE "public"."Company" DROP COLUMN "adminId";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "companyAdmin";

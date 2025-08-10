-- CreateEnum
CREATE TYPE "public"."AracTipi" AS ENUM ('BINEK', 'MINIBUS', 'MIDIBUS', 'OTOBUS');

-- AlterTable
ALTER TABLE "public"."Arac" ADD COLUMN     "aracTipi" "public"."AracTipi" NOT NULL DEFAULT 'BINEK';

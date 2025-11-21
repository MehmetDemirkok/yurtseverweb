-- CreateEnum
CREATE TYPE "public"."AracBakimTipi" AS ENUM ('BAKIM', 'ONARIM', 'SIGORTA', 'MUAYENE', 'LASTIK', 'YAKIT', 'DIGER');

-- CreateEnum
CREATE TYPE "public"."AracBakimDurum" AS ENUM ('PLANLANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'IPTAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AracDurum" ADD VALUE 'CALISMA';
ALTER TYPE "public"."AracDurum" ADD VALUE 'BAKIM';
ALTER TYPE "public"."AracDurum" ADD VALUE 'ARIZA';
ALTER TYPE "public"."AracDurum" ADD VALUE 'PASIF';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AracTipi" ADD VALUE 'KAMYON';
ALTER TYPE "public"."AracTipi" ADD VALUE 'PICKUP';

-- CreateTable
CREATE TABLE "public"."AracBakim" (
    "id" TEXT NOT NULL,
    "aracId" TEXT NOT NULL,
    "bakimTipi" "public"."AracBakimTipi" NOT NULL,
    "durum" "public"."AracBakimDurum" NOT NULL DEFAULT 'PLANLANDI',
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT,
    "planlananTarih" TIMESTAMP(3) NOT NULL,
    "baslamaTarihi" TIMESTAMP(3),
    "bitisTarihi" TIMESTAMP(3),
    "maliyet" DOUBLE PRECISION,
    "odemeDurumu" BOOLEAN NOT NULL DEFAULT false,
    "odemeTarihi" TIMESTAMP(3),
    "tedarikci" TEXT,
    "tedarikciTelefon" TEXT,
    "tedarikciAdres" TEXT,
    "notlar" TEXT,
    "dosyalar" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "AracBakim_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AracBakim" ADD CONSTRAINT "AracBakim_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "public"."Arac"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AracBakim" ADD CONSTRAINT "AracBakim_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AracBakim" ADD CONSTRAINT "AracBakim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

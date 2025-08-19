-- CreateEnum
CREATE TYPE "public"."UetdsDurum" AS ENUM ('BILDIRILMEDI', 'BILDIRILDI', 'GUNCELLENDI', 'IPTAL_BILDIRILDI', 'HATA');

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "uetdsPassword" TEXT,
ADD COLUMN     "uetdsTestMode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "uetdsUsername" TEXT,
ADD COLUMN     "uetdsYetkiBelgeNo" TEXT;

-- AlterTable
ALTER TABLE "public"."Sofor" ADD COLUMN     "tckn" TEXT;

-- AlterTable
ALTER TABLE "public"."Transfer" ADD COLUMN     "uetdsDurum" "public"."UetdsDurum" NOT NULL DEFAULT 'BILDIRILMEDI',
ADD COLUMN     "uetdsSeferReferansNo" TEXT,
ADD COLUMN     "uetdsSonMesaj" TEXT;

-- AlterTable
ALTER TABLE "public"."Yolcu" ADD COLUMN     "pasaportNo" TEXT,
ADD COLUMN     "tckn" TEXT;

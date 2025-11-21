-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "baslangicTarihi" TIMESTAMP(3),
ADD COLUMN     "bitisTarihi" TIMESTAMP(3),
ADD COLUMN     "hotelId" INTEGER,
ADD COLUMN     "lokasyon" TEXT,
ADD COLUMN     "sehir" TEXT,
ADD COLUMN     "ulke" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."Transfer" ADD COLUMN     "cariId" TEXT,
ADD COLUMN     "manuelAracMarka" TEXT,
ADD COLUMN     "manuelAracModel" TEXT,
ADD COLUMN     "manuelAracPlaka" TEXT,
ADD COLUMN     "manuelAracTip" TEXT,
ADD COLUMN     "manuelSoforAdi" TEXT,
ADD COLUMN     "tedarikciId" TEXT,
ADD COLUMN     "tedarikciyeYaptirilacak" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."Transfer" ADD CONSTRAINT "Transfer_cariId_fkey" FOREIGN KEY ("cariId") REFERENCES "public"."Cari"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transfer" ADD CONSTRAINT "Transfer_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "public"."Tedarikci"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AracDurum" AS ENUM ('MUSAIT', 'TRANSFERDE', 'BAKIMDA');

-- CreateEnum
CREATE TYPE "SoforDurum" AS ENUM ('MUSAIT', 'TRANSFERDE', 'IZINLI');

-- CreateEnum
CREATE TYPE "TransferDurum" AS ENUM ('BEKLEMEDE', 'YOLDA', 'TAMAMLANDI', 'IPTAL');

-- CreateTable
CREATE TABLE "Arac" (
    "id" TEXT NOT NULL,
    "plaka" TEXT NOT NULL,
    "marka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yolcuKapasitesi" INTEGER NOT NULL,
    "durum" "AracDurum" NOT NULL DEFAULT 'MUSAIT',
    "enlem" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boylam" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sonGuncelleme" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sofor" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "ehliyetSinifi" TEXT NOT NULL,
    "atananAracId" TEXT,
    "durum" "SoforDurum" NOT NULL DEFAULT 'MUSAIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sofor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "kalkisYeri" TEXT NOT NULL,
    "varisYeri" TEXT NOT NULL,
    "kalkisSaati" TEXT NOT NULL,
    "kalkisTarihi" TIMESTAMP(3) NOT NULL,
    "yolcuSayisi" INTEGER NOT NULL,
    "aracId" TEXT,
    "soforId" TEXT,
    "durum" "TransferDurum" NOT NULL DEFAULT 'BEKLEMEDE',
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Arac_plaka_key" ON "Arac"("plaka");

-- CreateIndex
CREATE UNIQUE INDEX "Sofor_telefon_key" ON "Sofor"("telefon");

-- AddForeignKey
ALTER TABLE "Sofor" ADD CONSTRAINT "Sofor_atananAracId_fkey" FOREIGN KEY ("atananAracId") REFERENCES "Arac"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_soforId_fkey" FOREIGN KEY ("soforId") REFERENCES "Sofor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

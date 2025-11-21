-- CreateEnum
CREATE TYPE "CariTip" AS ENUM ('MUSTERI', 'BAYI', 'KURUMSAL');

-- CreateEnum
CREATE TYPE "CariDurum" AS ENUM ('AKTIF', 'PASIF', 'ENGELLI');

-- CreateEnum
CREATE TYPE "TedarikciDurum" AS ENUM ('AKTIF', 'PASIF', 'ENGELLI');

-- CreateTable
CREATE TABLE "Cari" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT,
    "sirket" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "adres" TEXT,
    "sehir" TEXT,
    "ulke" TEXT NOT NULL DEFAULT 'Türkiye',
    "vergiNo" TEXT,
    "vergiDairesi" TEXT,
    "notlar" TEXT,
    "tip" "CariTip" NOT NULL DEFAULT 'MUSTERI',
    "durum" "CariDurum" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tedarikci" (
    "id" TEXT NOT NULL,
    "sirketAdi" TEXT NOT NULL,
    "yetkiliKisi" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "adres" TEXT,
    "sehir" TEXT,
    "ulke" TEXT NOT NULL DEFAULT 'Türkiye',
    "vergiNo" TEXT,
    "vergiDairesi" TEXT,
    "hizmetTuru" TEXT,
    "notlar" TEXT,
    "durum" "TedarikciDurum" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tedarikci_pkey" PRIMARY KEY ("id")
);

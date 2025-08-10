-- CreateEnum
CREATE TYPE "VehicleSaleStatus" AS ENUM ('BEKLEMEDE', 'TAMAMLANDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "AccommodationSaleStatus" AS ENUM ('BEKLEMEDE', 'TAMAMLANDI', 'IPTAL');

-- CreateTable
CREATE TABLE "VehicleSale" (
    "id" TEXT NOT NULL,
    "aracId" TEXT NOT NULL,
    "musteriAdi" TEXT NOT NULL,
    "musteriTelefon" TEXT NOT NULL,
    "satisFiyati" DOUBLE PRECISION NOT NULL,
    "satisTarihi" TEXT NOT NULL,
    "durum" "VehicleSaleStatus" NOT NULL DEFAULT 'BEKLEMEDE',
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationSale" (
    "id" TEXT NOT NULL,
    "musteriAdi" TEXT NOT NULL,
    "musteriTelefon" TEXT NOT NULL,
    "konaklamaTipi" TEXT NOT NULL,
    "odaTipi" TEXT NOT NULL,
    "girisTarihi" TEXT NOT NULL,
    "cikisTarihi" TEXT NOT NULL,
    "gecelikUcret" DOUBLE PRECISION NOT NULL,
    "toplamUcret" DOUBLE PRECISION NOT NULL,
    "satisTarihi" TEXT NOT NULL,
    "durum" "AccommodationSaleStatus" NOT NULL DEFAULT 'BEKLEMEDE',
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleSale" ADD CONSTRAINT "VehicleSale_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

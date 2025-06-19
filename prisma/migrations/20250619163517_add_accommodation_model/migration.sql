-- CreateTable
CREATE TABLE "Accommodation" (
    "id" SERIAL NOT NULL,
    "adiSoyadi" TEXT NOT NULL,
    "unvani" TEXT NOT NULL,
    "ulke" TEXT NOT NULL,
    "sehir" TEXT NOT NULL,
    "girisTarihi" TEXT NOT NULL,
    "cikisTarihi" TEXT NOT NULL,
    "odaTipi" TEXT NOT NULL,
    "konaklamaTipi" TEXT NOT NULL,
    "faturaEdildi" BOOLEAN NOT NULL,
    "gecelikUcret" DOUBLE PRECISION NOT NULL,
    "toplamUcret" DOUBLE PRECISION NOT NULL,
    "organizasyonAdi" TEXT,
    "otelAdi" TEXT,
    "kurumCari" TEXT,
    "numberOfNights" INTEGER,

    CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

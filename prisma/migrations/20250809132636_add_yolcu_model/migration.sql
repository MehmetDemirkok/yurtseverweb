-- CreateTable
CREATE TABLE "Yolcu" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "telefon" TEXT,
    "ucusSaati" TEXT,
    "ucusTkKodu" TEXT,
    "transferId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Yolcu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Yolcu" ADD CONSTRAINT "Yolcu_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

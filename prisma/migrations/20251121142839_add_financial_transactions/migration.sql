-- CreateEnum
CREATE TYPE "public"."FinancialTransactionType" AS ENUM ('GELIR', 'GIDER');

-- CreateEnum
CREATE TYPE "public"."FinancialTransactionCategory" AS ENUM ('KONAKLAMA', 'TRANSFER', 'OFIS_GIDERLERI', 'TEDARIKCI_ODEMESI', 'MAAŞ', 'VERGI', 'DİĞER');

-- CreateTable
CREATE TABLE "public"."FinancialTransaction" (
    "id" SERIAL NOT NULL,
    "type" "public"."FinancialTransactionType" NOT NULL,
    "category" "public"."FinancialTransactionCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialTransaction_companyId_idx" ON "public"."FinancialTransaction"("companyId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_date_idx" ON "public"."FinancialTransaction"("date");

-- CreateIndex
CREATE INDEX "FinancialTransaction_type_idx" ON "public"."FinancialTransaction"("type");

-- AddForeignKey
ALTER TABLE "public"."FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

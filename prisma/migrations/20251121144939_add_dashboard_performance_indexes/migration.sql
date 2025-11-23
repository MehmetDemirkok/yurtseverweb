-- CreateIndex
CREATE INDEX IF NOT EXISTS "Accommodation_companyId_idx" ON "Accommodation"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Accommodation_companyId_createdAt_idx" ON "Accommodation"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Accommodation_companyId_girisTarihi_cikisTarihi_idx" ON "Accommodation"("companyId", "girisTarihi", "cikisTarihi");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccommodationSale_companyId_idx" ON "AccommodationSale"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccommodationSale_companyId_createdAt_idx" ON "AccommodationSale"("companyId", "createdAt");


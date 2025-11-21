/*
  Warnings:

  - The values [MUDUR,OPERATOR,KULLANICI] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- Önce mevcut kullanıcıların rollerini yeni role dönüştür
UPDATE "User" SET "role" = 'MUDUR' WHERE "role" IN ('MUDUR', 'OPERATOR', 'KULLANICI');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SIRKET_YONETICISI');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE 
    WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role_new"
    WHEN "role"::text IN ('MUDUR', 'OPERATOR', 'KULLANICI') THEN 'SIRKET_YONETICISI'::"Role_new"
    ELSE 'SIRKET_YONETICISI'::"Role_new"
  END
);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'SIRKET_YONETICISI';
COMMIT;


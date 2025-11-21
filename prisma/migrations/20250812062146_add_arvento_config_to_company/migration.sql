-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "arventoApiKey" TEXT,
ADD COLUMN     "arventoBaseUrl" TEXT DEFAULT 'https://api.arvento.com',
ADD COLUMN     "arventoIsConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "arventoLastTest" TIMESTAMP(3);

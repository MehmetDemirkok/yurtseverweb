-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "recordData" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

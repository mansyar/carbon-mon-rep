-- CreateTable
CREATE TABLE "Emission" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Emission_pkey" PRIMARY KEY ("id")
);

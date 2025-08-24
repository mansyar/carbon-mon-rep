/*
  Warnings:

  - The primary key for the `Emission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `amount` on the `Emission` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Emission` table. All the data in the column will be lost.
  - Added the required column `emissionType` to the `Emission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Emission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Emission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Emission` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Emission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DATA_ENTRY', 'AUDITOR', 'VIEWER');

-- AlterTable
ALTER TABLE "Emission" DROP CONSTRAINT "Emission_pkey",
DROP COLUMN "amount",
DROP COLUMN "source",
ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emissionType" VARCHAR(50) NOT NULL,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "siteId" UUID NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" DECIMAL(18,6) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ADD CONSTRAINT "Emission_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DATA_ENTRY',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID,
    "diff" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvMapping" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsvMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadJob" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL,
    "insertedCount" INTEGER,
    "failedCount" INTEGER,
    "errorFileUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "format" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpConnector" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpConnector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Emission_siteId_timestamp_idx" ON "Emission"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "Emission_emissionType_idx" ON "Emission"("emissionType");

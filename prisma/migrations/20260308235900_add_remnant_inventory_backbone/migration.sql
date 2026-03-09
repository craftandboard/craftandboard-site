-- CreateEnum
CREATE TYPE "RemnantGrainDirection" AS ENUM ('NONE', 'LENGTH', 'WIDTH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RemnantEdgeCondition" AS ENUM ('RAW', 'ONE_CLEAN_EDGE', 'TWO_CLEAN_EDGES', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RemnantQualityGrade" AS ENUM ('A', 'B', 'C', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RemnantAllocationType" AS ENUM ('RESERVE', 'ALLOCATE');

-- CreateEnum
CREATE TYPE "RemnantAllocationTargetType" AS ENUM ('SHELF_JOB', 'MANUFACTURING_BATCH', 'COST_SCENARIO', 'MANUAL');

-- CreateEnum
CREATE TYPE "RemnantAllocationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RemnantSourceType" ADD VALUE 'CNC_LEFTOVER';
ALTER TYPE "RemnantSourceType" ADD VALUE 'MANUAL_ENTRY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RemnantStatus" ADD VALUE 'ALLOCATED';
ALTER TYPE "RemnantStatus" ADD VALUE 'SCRAP';

-- AlterEnum
ALTER TYPE "RemnantUsageActionType" ADD VALUE 'ALLOCATED';

-- AlterEnum
ALTER TYPE "ScanEntityType" ADD VALUE 'REMNANT';

-- AlterTable
ALTER TABLE "LabelRenderJob" ADD COLUMN     "remnantId" TEXT;

-- AlterTable
ALTER TABLE "Remnant" ADD COLUMN     "barcodeValue" TEXT,
ADD COLUMN     "currentContainerId" TEXT,
ADD COLUMN     "currentLocationId" TEXT,
ADD COLUMN     "edgeCondition" "RemnantEdgeCondition",
ADD COLUMN     "grainDirection" "RemnantGrainDirection",
ADD COLUMN     "materialName" TEXT,
ADD COLUMN     "qrValue" TEXT,
ADD COLUMN     "qualityGrade" "RemnantQualityGrade",
ADD COLUMN     "remnantCode" TEXT,
ADD COLUMN     "sourcePacketId" TEXT,
ADD COLUMN     "sourcePartId" TEXT,
ADD COLUMN     "sourceReferenceId" TEXT;

-- CreateTable
CREATE TABLE "RemnantMovement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "remnantId" TEXT NOT NULL,
    "fromContainerId" TEXT,
    "toContainerId" TEXT,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "movedByUserId" TEXT,
    "reason" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemnantMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemnantAllocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "remnantId" TEXT NOT NULL,
    "allocationType" "RemnantAllocationType" NOT NULL,
    "targetType" "RemnantAllocationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reservedAreaSqIn" DECIMAL(10,3),
    "reservedLengthIn" DECIMAL(8,3),
    "reservedWidthIn" DECIMAL(8,3),
    "status" "RemnantAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdByUserId" TEXT,
    "releasedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "RemnantAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RemnantMovement_organizationId_createdAt_idx" ON "RemnantMovement"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "RemnantMovement_organizationId_remnantId_createdAt_idx" ON "RemnantMovement"("organizationId", "remnantId", "createdAt");

-- CreateIndex
CREATE INDEX "RemnantAllocation_organizationId_status_createdAt_idx" ON "RemnantAllocation"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RemnantAllocation_organizationId_remnantId_status_idx" ON "RemnantAllocation"("organizationId", "remnantId", "status");

-- CreateIndex
CREATE INDEX "RemnantAllocation_organizationId_targetType_targetId_status_idx" ON "RemnantAllocation"("organizationId", "targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "LabelRenderJob_remnantId_idx" ON "LabelRenderJob"("remnantId");

-- CreateIndex
CREATE INDEX "Remnant_organizationId_materialCode_thicknessIn_status_idx" ON "Remnant"("organizationId", "materialCode", "thicknessIn", "status");

-- CreateIndex
CREATE INDEX "Remnant_organizationId_currentContainerId_idx" ON "Remnant"("organizationId", "currentContainerId");

-- CreateIndex
CREATE INDEX "Remnant_organizationId_currentLocationId_idx" ON "Remnant"("organizationId", "currentLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "Remnant_organizationId_remnantCode_key" ON "Remnant"("organizationId", "remnantCode");

-- CreateIndex
CREATE UNIQUE INDEX "Remnant_organizationId_barcodeValue_key" ON "Remnant"("organizationId", "barcodeValue");

-- CreateIndex
CREATE UNIQUE INDEX "Remnant_organizationId_qrValue_key" ON "Remnant"("organizationId", "qrValue");

-- AddForeignKey
ALTER TABLE "Remnant" ADD CONSTRAINT "Remnant_sourcePacketId_fkey" FOREIGN KEY ("sourcePacketId") REFERENCES "ManufacturingPacket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remnant" ADD CONSTRAINT "Remnant_sourcePartId_fkey" FOREIGN KEY ("sourcePartId") REFERENCES "ManufacturingPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remnant" ADD CONSTRAINT "Remnant_currentContainerId_fkey" FOREIGN KEY ("currentContainerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remnant" ADD CONSTRAINT "Remnant_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_remnantId_fkey" FOREIGN KEY ("remnantId") REFERENCES "Remnant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_fromContainerId_fkey" FOREIGN KEY ("fromContainerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_toContainerId_fkey" FOREIGN KEY ("toContainerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantMovement" ADD CONSTRAINT "RemnantMovement_movedByUserId_fkey" FOREIGN KEY ("movedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantAllocation" ADD CONSTRAINT "RemnantAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantAllocation" ADD CONSTRAINT "RemnantAllocation_remnantId_fkey" FOREIGN KEY ("remnantId") REFERENCES "Remnant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantAllocation" ADD CONSTRAINT "RemnantAllocation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantAllocation" ADD CONSTRAINT "RemnantAllocation_releasedByUserId_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelRenderJob" ADD CONSTRAINT "LabelRenderJob_remnantId_fkey" FOREIGN KEY ("remnantId") REFERENCES "Remnant"("id") ON DELETE SET NULL ON UPDATE CASCADE;


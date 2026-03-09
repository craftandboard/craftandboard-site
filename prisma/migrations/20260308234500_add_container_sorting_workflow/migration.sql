-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContainerStatus" ADD VALUE 'AVAILABLE';
ALTER TYPE "ContainerStatus" ADD VALUE 'IN_USE';
ALTER TYPE "ContainerStatus" ADD VALUE 'RETIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContainerType" ADD VALUE 'CART';
ALTER TYPE "ContainerType" ADD VALUE 'TOTE';
ALTER TYPE "ContainerType" ADD VALUE 'PALLET';
ALTER TYPE "ContainerType" ADD VALUE 'RACK_SLOT';
ALTER TYPE "ContainerType" ADD VALUE 'STAGING_AREA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScanEntityType" ADD VALUE 'CONTAINER';
ALTER TYPE "ScanEntityType" ADD VALUE 'CONTAINER_LOCATION';

-- DropForeignKey
ALTER TABLE "Container" DROP CONSTRAINT "Container_batchId_fkey";

-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "barcodeValue" TEXT,
ADD COLUMN     "capacityNotes" TEXT,
ADD COLUMN     "containerCode" TEXT,
ADD COLUMN     "currentLocationId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manufacturingBatchId" TEXT,
ADD COLUMN     "qrValue" TEXT,
ALTER COLUMN "batchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ManufacturingPart" ADD COLUMN     "currentContainerId" TEXT;

-- CreateTable
CREATE TABLE "ContainerLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "manufacturingPartId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "assignedByUserId" TEXT,
    "unassignedByUserId" TEXT,
    "assignmentReason" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerMoveEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "movedByUserId" TEXT,
    "moveReason" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContainerMoveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveContainerSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "stationType" "ScanWorkflowStationType",
    "startedByUserId" TEXT,
    "endedByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveContainerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContainerLocation_organizationId_isActive_idx" ON "ContainerLocation"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContainerLocation_organizationId_code_key" ON "ContainerLocation"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ContainerAssignment_organizationId_assignedAt_idx" ON "ContainerAssignment"("organizationId", "assignedAt");

-- CreateIndex
CREATE INDEX "ContainerAssignment_organizationId_containerId_unassignedAt_idx" ON "ContainerAssignment"("organizationId", "containerId", "unassignedAt");

-- CreateIndex
CREATE INDEX "ContainerAssignment_organizationId_manufacturingPartId_unas_idx" ON "ContainerAssignment"("organizationId", "manufacturingPartId", "unassignedAt");

-- CreateIndex
CREATE INDEX "ContainerMoveEvent_organizationId_createdAt_idx" ON "ContainerMoveEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ContainerMoveEvent_organizationId_containerId_createdAt_idx" ON "ContainerMoveEvent"("organizationId", "containerId", "createdAt");

-- CreateIndex
CREATE INDEX "ActiveContainerSession_organizationId_isActive_startedAt_idx" ON "ActiveContainerSession"("organizationId", "isActive", "startedAt");

-- CreateIndex
CREATE INDEX "ActiveContainerSession_organizationId_startedByUserId_isAct_idx" ON "ActiveContainerSession"("organizationId", "startedByUserId", "isActive");

-- CreateIndex
CREATE INDEX "ActiveContainerSession_organizationId_containerId_isActive_idx" ON "ActiveContainerSession"("organizationId", "containerId", "isActive");

-- CreateIndex
CREATE INDEX "Container_organizationId_manufacturingBatchId_status_idx" ON "Container"("organizationId", "manufacturingBatchId", "status");

-- CreateIndex
CREATE INDEX "Container_organizationId_currentLocationId_idx" ON "Container"("organizationId", "currentLocationId");

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_currentContainerId_idx" ON "ManufacturingPart"("organizationId", "currentContainerId");

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_manufacturingBatchId_fkey" FOREIGN KEY ("manufacturingBatchId") REFERENCES "ManufacturingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_currentContainerId_fkey" FOREIGN KEY ("currentContainerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerLocation" ADD CONSTRAINT "ContainerLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerAssignment" ADD CONSTRAINT "ContainerAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerAssignment" ADD CONSTRAINT "ContainerAssignment_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerAssignment" ADD CONSTRAINT "ContainerAssignment_manufacturingPartId_fkey" FOREIGN KEY ("manufacturingPartId") REFERENCES "ManufacturingPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerAssignment" ADD CONSTRAINT "ContainerAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerAssignment" ADD CONSTRAINT "ContainerAssignment_unassignedByUserId_fkey" FOREIGN KEY ("unassignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerMoveEvent" ADD CONSTRAINT "ContainerMoveEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerMoveEvent" ADD CONSTRAINT "ContainerMoveEvent_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerMoveEvent" ADD CONSTRAINT "ContainerMoveEvent_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerMoveEvent" ADD CONSTRAINT "ContainerMoveEvent_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerMoveEvent" ADD CONSTRAINT "ContainerMoveEvent_movedByUserId_fkey" FOREIGN KEY ("movedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveContainerSession" ADD CONSTRAINT "ActiveContainerSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveContainerSession" ADD CONSTRAINT "ActiveContainerSession_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveContainerSession" ADD CONSTRAINT "ActiveContainerSession_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveContainerSession" ADD CONSTRAINT "ActiveContainerSession_endedByUserId_fkey" FOREIGN KEY ("endedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


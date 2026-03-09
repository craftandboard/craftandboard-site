-- CreateEnum
CREATE TYPE "ScanEntityType" AS ENUM ('MANUFACTURING_PART', 'MANUFACTURING_BATCH');

-- CreateEnum
CREATE TYPE "ScanWorkflowStationType" AS ENUM ('CUT', 'EDGEBAND', 'PACKAGING', 'QC', 'SHIPPING', 'STAGING', 'CONTAINER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ScanActionType" AS ENUM ('LOOKUP', 'CHECK_IN', 'CHECK_OUT', 'MARK_STAGE_COMPLETE', 'MOVE', 'ASSIGN_CONTAINER', 'REPRINT_LABEL');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('ACCEPTED', 'REJECTED', 'NOOP');

-- CreateEnum
CREATE TYPE "LabelRenderFormat" AS ENUM ('JSON', 'HTML', 'PDF');

-- DropForeignKey
ALTER TABLE "ScanEvent" DROP CONSTRAINT "ScanEvent_stationId_fkey";

-- AlterTable
ALTER TABLE "ScanEvent" ADD COLUMN     "actionType" "ScanActionType" NOT NULL DEFAULT 'LOOKUP',
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" "ScanEntityType",
ADD COLUMN     "manufacturingBatchId" TEXT,
ADD COLUMN     "manufacturingPartId" TEXT,
ADD COLUMN     "metadataJson" JSONB,
ADD COLUMN     "nextStatus" TEXT,
ADD COLUMN     "previousStatus" TEXT,
ADD COLUMN     "result" "ScanResult" NOT NULL DEFAULT 'NOOP',
ADD COLUMN     "resultReason" TEXT,
ADD COLUMN     "scanValue" TEXT,
ADD COLUMN     "scannedByUserId" TEXT,
ADD COLUMN     "stationType" "ScanWorkflowStationType" NOT NULL DEFAULT 'UNKNOWN',
ALTER COLUMN "stationId" DROP NOT NULL,
ALTER COLUMN "code" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LabelRenderJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" "ScanEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "manufacturingPartId" TEXT,
    "manufacturingBatchId" TEXT,
    "templateId" TEXT,
    "renderFormat" "LabelRenderFormat" NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "outputHtml" TEXT,
    "outputPath" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabelRenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStationRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stationType" "ScanWorkflowStationType" NOT NULL,
    "entityType" "ScanEntityType" NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "actionType" "ScanActionType" NOT NULL,
    "toStatus" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabelRenderJob_organizationId_entityType_entityId_createdAt_idx" ON "LabelRenderJob"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "LabelRenderJob_manufacturingPartId_idx" ON "LabelRenderJob"("manufacturingPartId");

-- CreateIndex
CREATE INDEX "LabelRenderJob_manufacturingBatchId_idx" ON "LabelRenderJob"("manufacturingBatchId");

-- CreateIndex
CREATE INDEX "LabelRenderJob_templateId_idx" ON "LabelRenderJob"("templateId");

-- CreateIndex
CREATE INDEX "LabelRenderJob_createdByUserId_idx" ON "LabelRenderJob"("createdByUserId");

-- CreateIndex
CREATE INDEX "WorkflowStationRule_organizationId_stationType_entityType_i_idx" ON "WorkflowStationRule"("organizationId", "stationType", "entityType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStationRule_organizationId_stationType_entityType_f_key" ON "WorkflowStationRule"("organizationId", "stationType", "entityType", "fromStatus", "actionType", "toStatus");

-- CreateIndex
CREATE INDEX "ScanEvent_organizationId_entityType_entityId_createdAt_idx" ON "ScanEvent"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_organizationId_stationType_createdAt_idx" ON "ScanEvent"("organizationId", "stationType", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_organizationId_result_createdAt_idx" ON "ScanEvent"("organizationId", "result", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_manufacturingPartId_idx" ON "ScanEvent"("manufacturingPartId");

-- CreateIndex
CREATE INDEX "ScanEvent_manufacturingBatchId_idx" ON "ScanEvent"("manufacturingBatchId");

-- CreateIndex
CREATE INDEX "ScanEvent_scannedByUserId_idx" ON "ScanEvent"("scannedByUserId");

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_manufacturingPartId_fkey" FOREIGN KEY ("manufacturingPartId") REFERENCES "ManufacturingPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_manufacturingBatchId_fkey" FOREIGN KEY ("manufacturingBatchId") REFERENCES "ManufacturingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelRenderJob" ADD CONSTRAINT "LabelRenderJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelRenderJob" ADD CONSTRAINT "LabelRenderJob_manufacturingPartId_fkey" FOREIGN KEY ("manufacturingPartId") REFERENCES "ManufacturingPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelRenderJob" ADD CONSTRAINT "LabelRenderJob_manufacturingBatchId_fkey" FOREIGN KEY ("manufacturingBatchId") REFERENCES "ManufacturingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelRenderJob" ADD CONSTRAINT "LabelRenderJob_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LabelTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelRenderJob" ADD CONSTRAINT "LabelRenderJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStationRule" ADD CONSTRAINT "WorkflowStationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


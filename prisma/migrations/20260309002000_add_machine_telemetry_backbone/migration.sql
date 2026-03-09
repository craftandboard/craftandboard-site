-- CreateEnum
CREATE TYPE "MachineSourceType" AS ENUM ('WEBHOOK', 'POLL_IMPORT', 'MANUAL_UPLOAD', 'LOCAL_AGENT', 'PLC_BRIDGE');

-- CreateEnum
CREATE TYPE "MachineEventIngestType" AS ENUM ('SINGLE_EVENT', 'EVENT_BATCH', 'FILE_IMPORT');

-- CreateEnum
CREATE TYPE "MachineEventIngestRunStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "MachineTelemetryEntityType" AS ENUM ('MANUFACTURING_BATCH', 'MANUFACTURING_PART', 'REMNANT', 'MACHINE_SOURCE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MachineEventLinkConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "MachineEventLinkMethod" AS ENUM ('EXTERNAL_ID_MATCH', 'PART_NUMBER_MATCH', 'BATCH_NUMBER_MATCH', 'PROGRAM_NAME_MATCH', 'REMNANT_CODE_MATCH', 'MANUAL', 'HEURISTIC');

-- CreateEnum
CREATE TYPE "MachineStageCandidateStatus" AS ENUM ('NEW', 'REVIEWED', 'APPLIED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MachineEventProcessingStatus" ADD VALUE 'RAW';
ALTER TYPE "MachineEventProcessingStatus" ADD VALUE 'NORMALIZED';
ALTER TYPE "MachineEventProcessingStatus" ADD VALUE 'SIGNAL_EMITTED';
ALTER TYPE "MachineEventProcessingStatus" ADD VALUE 'DUPLICATE';
ALTER TYPE "MachineEventProcessingStatus" ADD VALUE 'FAILED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MachineType" ADD VALUE 'SAW';
ALTER TYPE "MachineType" ADD VALUE 'DRILL';
ALTER TYPE "MachineType" ADD VALUE 'PLC';

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "currentLocationId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metadataJson" JSONB,
ADD COLUMN     "sourceType" "MachineSourceType" NOT NULL DEFAULT 'WEBHOOK';

-- AlterTable
ALTER TABLE "MachineEvent" ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" "MachineTelemetryEntityType",
ADD COLUMN     "eventHash" TEXT,
ADD COLUMN     "externalEventId" TEXT,
ADD COLUMN     "ingestRunId" TEXT,
ADD COLUMN     "linkedManufacturingBatchId" TEXT,
ADD COLUMN     "linkedManufacturingPartId" TEXT,
ADD COLUMN     "linkedRemnantId" TEXT,
ADD COLUMN     "machineState" TEXT,
ADD COLUMN     "normalizedPayloadJson" JSONB,
ADD COLUMN     "normalizedRemnantRef" TEXT,
ADD COLUMN     "operatorName" TEXT,
ADD COLUMN     "programName" TEXT,
ADD COLUMN     "rawEnvelopeJson" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "MachineEventIngestRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "machineSourceId" TEXT,
    "ingestType" "MachineEventIngestType" NOT NULL,
    "sourceReference" TEXT,
    "rawEnvelopeJson" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "MachineEventIngestRunStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineEventIngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineEventLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "machineEventId" TEXT NOT NULL,
    "entityType" "MachineTelemetryEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "confidence" "MachineEventLinkConfidence" NOT NULL,
    "linkMethod" "MachineEventLinkMethod" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineEventLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineStageCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "machineEventId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "entityType" "MachineTelemetryEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "confidence" "MachineEventLinkConfidence" NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "MachineStageCandidateStatus" NOT NULL DEFAULT 'NEW',
    "emittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineStageCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachineEventIngestRun_organizationId_createdAt_idx" ON "MachineEventIngestRun"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MachineEventIngestRun_organizationId_status_createdAt_idx" ON "MachineEventIngestRun"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MachineEventIngestRun_machineSourceId_idx" ON "MachineEventIngestRun"("machineSourceId");

-- CreateIndex
CREATE INDEX "MachineEventLink_organizationId_machineEventId_createdAt_idx" ON "MachineEventLink"("organizationId", "machineEventId", "createdAt");

-- CreateIndex
CREATE INDEX "MachineEventLink_organizationId_entityType_entityId_created_idx" ON "MachineEventLink"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "MachineStageCandidate_organizationId_status_createdAt_idx" ON "MachineStageCandidate"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MachineStageCandidate_organizationId_entityType_entityId_cr_idx" ON "MachineStageCandidate"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "MachineStageCandidate_machineEventId_idx" ON "MachineStageCandidate"("machineEventId");

-- CreateIndex
CREATE INDEX "Machine_organizationId_sourceType_status_idx" ON "Machine"("organizationId", "sourceType", "status");

-- CreateIndex
CREATE INDEX "Machine_organizationId_currentLocationId_idx" ON "Machine"("organizationId", "currentLocationId");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_eventTs_idx" ON "MachineEvent"("organizationId", "eventTs");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_dedupeKey_idx" ON "MachineEvent"("organizationId", "dedupeKey");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_eventHash_idx" ON "MachineEvent"("organizationId", "eventHash");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_entityType_entityId_idx" ON "MachineEvent"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "MachineEvent_ingestRunId_idx" ON "MachineEvent"("ingestRunId");

-- CreateIndex
CREATE INDEX "MachineEvent_linkedManufacturingBatchId_idx" ON "MachineEvent"("linkedManufacturingBatchId");

-- CreateIndex
CREATE INDEX "MachineEvent_linkedManufacturingPartId_idx" ON "MachineEvent"("linkedManufacturingPartId");

-- CreateIndex
CREATE INDEX "MachineEvent_linkedRemnantId_idx" ON "MachineEvent"("linkedRemnantId");

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "ContainerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEventIngestRun" ADD CONSTRAINT "MachineEventIngestRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEventIngestRun" ADD CONSTRAINT "MachineEventIngestRun_machineSourceId_fkey" FOREIGN KEY ("machineSourceId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_ingestRunId_fkey" FOREIGN KEY ("ingestRunId") REFERENCES "MachineEventIngestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_linkedManufacturingBatchId_fkey" FOREIGN KEY ("linkedManufacturingBatchId") REFERENCES "ManufacturingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_linkedManufacturingPartId_fkey" FOREIGN KEY ("linkedManufacturingPartId") REFERENCES "ManufacturingPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_linkedRemnantId_fkey" FOREIGN KEY ("linkedRemnantId") REFERENCES "Remnant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEventLink" ADD CONSTRAINT "MachineEventLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEventLink" ADD CONSTRAINT "MachineEventLink_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEventLink" ADD CONSTRAINT "MachineEventLink_machineEventId_fkey" FOREIGN KEY ("machineEventId") REFERENCES "MachineEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineStageCandidate" ADD CONSTRAINT "MachineStageCandidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineStageCandidate" ADD CONSTRAINT "MachineStageCandidate_machineEventId_fkey" FOREIGN KEY ("machineEventId") REFERENCES "MachineEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineStageCandidate" ADD CONSTRAINT "MachineStageCandidate_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


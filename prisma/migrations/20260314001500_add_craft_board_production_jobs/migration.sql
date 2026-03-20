-- CreateEnum
CREATE TYPE "CraftBoardProductionJobStatus" AS ENUM (
  'RELEASED',
  'PREP_IN_PROGRESS',
  'READY_FOR_BUILD',
  'IN_BUILD',
  'BUILD_COMPLETE',
  'READY_FOR_FULFILLMENT',
  'FULFILLED',
  'CANCELLED'
);

-- CreateTable
CREATE TABLE "CraftBoardProductionJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "productionJobNumber" TEXT NOT NULL,
  "status" "CraftBoardProductionJobStatus" NOT NULL DEFAULT 'RELEASED',
  "orderId" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "depositRequestId" TEXT NOT NULL,
  "releasedFromOrderAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "startedAt" TIMESTAMP(3),
  "readyForBuildAt" TIMESTAMP(3),
  "buildStartedAt" TIMESTAMP(3),
  "buildCompletedAt" TIMESTAMP(3),
  "readyForFulfillmentAt" TIMESTAMP(3),
  "fulfilledAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "customerNameSnapshot" TEXT NOT NULL,
  "productFamily" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "reviewedWidthValue" DECIMAL(65,30),
  "reviewedWidthUnit" TEXT NOT NULL,
  "reviewedDepthValue" DECIMAL(65,30),
  "reviewedDepthUnit" TEXT NOT NULL,
  "reviewedThicknessValue" DECIMAL(65,30),
  "reviewedThicknessUnit" TEXT NOT NULL,
  "reviewedQuantity" INTEGER NOT NULL,
  "reviewedMaterialCode" TEXT,
  "reviewedMaterialLabel" TEXT,
  "reviewedMountingCode" TEXT,
  "reviewedMountingLabel" TEXT,
  "leadTimeText" TEXT,
  "targetCompletionDate" TIMESTAMP(3),
  "requestedShipDate" TIMESTAMP(3),
  "productionPrepNotes" TEXT,
  "shopNotes" TEXT,
  "fulfillmentNotes" TEXT,
  "cutPrepNotes" TEXT,
  "materialPrepNotes" TEXT,
  "packagingPrepNotes" TEXT,
  "checklistDimensionsConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "checklistMaterialConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "checklistMountingConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "checklistDepositVerified" BOOLEAN NOT NULL DEFAULT true,
  "checklistScopeConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "checklistReadyForBuild" BOOLEAN NOT NULL DEFAULT false,
  "internalSummaryJson" JSONB,
  "configurationSnapshotJson" JSONB,
  "commercialReferenceJson" JSONB,

  CONSTRAINT "CraftBoardProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CraftBoardProductionJob_productionJobNumber_key" ON "CraftBoardProductionJob"("productionJobNumber");
CREATE UNIQUE INDEX "CraftBoardProductionJob_orderId_key" ON "CraftBoardProductionJob"("orderId");
CREATE INDEX "CraftBoardProductionJob_organizationId_createdAt_idx" ON "CraftBoardProductionJob"("organizationId", "createdAt");
CREATE INDEX "CraftBoardProductionJob_organizationId_status_idx" ON "CraftBoardProductionJob"("organizationId", "status");
CREATE INDEX "CraftBoardProductionJob_targetCompletionDate_idx" ON "CraftBoardProductionJob"("targetCompletionDate");
CREATE INDEX "CraftBoardProductionJob_productionJobNumber_idx" ON "CraftBoardProductionJob"("productionJobNumber");
CREATE INDEX "CraftBoardProductionJob_orderId_idx" ON "CraftBoardProductionJob"("orderId");

-- AddForeignKey
ALTER TABLE "CraftBoardProductionJob"
  ADD CONSTRAINT "CraftBoardProductionJob_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProductionJob"
  ADD CONSTRAINT "CraftBoardProductionJob_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "CraftBoardOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProductionJob"
  ADD CONSTRAINT "CraftBoardProductionJob_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "CraftBoardInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProductionJob"
  ADD CONSTRAINT "CraftBoardProductionJob_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "CraftBoardProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProductionJob"
  ADD CONSTRAINT "CraftBoardProductionJob_depositRequestId_fkey"
  FOREIGN KEY ("depositRequestId") REFERENCES "CraftBoardDepositRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

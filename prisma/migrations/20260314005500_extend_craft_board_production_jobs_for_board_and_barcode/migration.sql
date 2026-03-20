-- CreateEnum
CREATE TYPE "CraftBoardProductionJobStage" AS ENUM (
  'PREP',
  'READY_TO_BUILD',
  'IN_BUILD',
  'BUILD_COMPLETE',
  'READY_TO_FULFILL',
  'FULFILLED',
  'CANCELLED'
);

-- AlterTable
ALTER TABLE "CraftBoardProductionJob"
  ADD COLUMN "productionJobCode" TEXT,
  ADD COLUMN "productionJobScanCode" TEXT,
  ADD COLUMN "stage" "CraftBoardProductionJobStage" NOT NULL DEFAULT 'PREP',
  ADD COLUMN "boardSortOrder" INTEGER,
  ADD COLUMN "labelPayloadJson" JSONB,
  ADD COLUMN "lastStageChangedAt" TIMESTAMP(3),
  ADD COLUMN "lastStageChangedBy" TEXT,
  ADD COLUMN "barcodeLabelPrintedAt" TIMESTAMP(3),
  ADD COLUMN "archivedFromBoardAt" TIMESTAMP(3);

-- Backfill stable codes from existing job number
UPDATE "CraftBoardProductionJob"
SET
  "productionJobCode" = "productionJobNumber",
  "productionJobScanCode" = 'CBJOB:' || "productionJobNumber",
  "labelPayloadJson" = jsonb_build_object(
    'productionJobNumber', "productionJobNumber",
    'productionJobCode', "productionJobNumber",
    'productionJobScanCode', 'CBJOB:' || "productionJobNumber",
    'customerName', "customerNameSnapshot",
    'productName', "productName",
    'productFamily', "productFamily",
    'dimensions', jsonb_build_object(
      'width', "reviewedWidthValue",
      'widthUnit', "reviewedWidthUnit",
      'depth', "reviewedDepthValue",
      'depthUnit', "reviewedDepthUnit",
      'thickness', "reviewedThicknessValue",
      'thicknessUnit', "reviewedThicknessUnit"
    ),
    'quantity', "reviewedQuantity",
    'materialLabel', "reviewedMaterialLabel",
    'mountingLabel', "reviewedMountingLabel",
    'stage', 'PREP'
  ),
  "lastStageChangedAt" = "createdAt"
WHERE "productionJobCode" IS NULL OR "productionJobScanCode" IS NULL;

-- Enforce not null after backfill
ALTER TABLE "CraftBoardProductionJob"
  ALTER COLUMN "productionJobCode" SET NOT NULL,
  ALTER COLUMN "productionJobScanCode" SET NOT NULL;

-- Indexes
CREATE UNIQUE INDEX "CraftBoardProductionJob_productionJobCode_key" ON "CraftBoardProductionJob"("productionJobCode");
CREATE UNIQUE INDEX "CraftBoardProductionJob_productionJobScanCode_key" ON "CraftBoardProductionJob"("productionJobScanCode");
CREATE INDEX "CraftBoardProductionJob_organizationId_stage_idx" ON "CraftBoardProductionJob"("organizationId", "stage");
CREATE INDEX "CraftBoardProductionJob_productionJobCode_idx" ON "CraftBoardProductionJob"("productionJobCode");
CREATE INDEX "CraftBoardProductionJob_productionJobScanCode_idx" ON "CraftBoardProductionJob"("productionJobScanCode");
CREATE INDEX "CraftBoardProductionJob_lastStageChangedAt_idx" ON "CraftBoardProductionJob"("lastStageChangedAt");

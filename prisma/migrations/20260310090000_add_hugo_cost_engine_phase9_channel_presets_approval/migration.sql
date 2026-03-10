DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ListingPrepPackageStatus'
      AND e.enumlabel = 'APPROVED'
  ) THEN
    ALTER TYPE "ListingPrepPackageStatus" ADD VALUE 'APPROVED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ListingPrepPackageStatus'
      AND e.enumlabel = 'APPROVED_WITH_OVERRIDE'
  ) THEN
    ALTER TYPE "ListingPrepPackageStatus" ADD VALUE 'APPROVED_WITH_OVERRIDE';
  END IF;
END $$;

CREATE TYPE "ChannelMappingChannelCode" AS ENUM ('AMAZON_MANUAL');

ALTER TABLE "CalculationScenario"
  ADD COLUMN "latestApprovalSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "selectedListingPrepApprovalSnapshot" JSONB,
  ADD COLUMN "selectedListingPrepExportContractVersion" TEXT;

ALTER TABLE "ListingPrepPackage"
  ADD COLUMN "channelMappingPresetId" TEXT,
  ADD COLUMN "approvalState" "ListingPrepPackageStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "approvalSummarySnapshot" JSONB,
  ADD COLUMN "exportContractVersion" TEXT,
  ADD COLUMN "manualAmazonExportSnapshot" JSONB,
  ADD COLUMN "currentApprovedArtifact" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ChannelMappingPreset" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT,
  "name" TEXT NOT NULL,
  "channelCode" "ChannelMappingChannelCode" NOT NULL DEFAULT 'AMAZON_MANUAL',
  "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "productLabelFormat" TEXT,
  "skuFormat" TEXT,
  "includeWarningNotes" BOOLEAN NOT NULL DEFAULT true,
  "includeOverrideNotes" BOOLEAN NOT NULL DEFAULT true,
  "dimensionsFormat" TEXT,
  "materialFormat" TEXT,
  "packagingFormat" TEXT,
  "pricingFormat" TEXT,
  "fieldOrderingSnapshot" JSONB,
  "notes" TEXT,
  "presetSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChannelMappingPreset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChannelMappingPreset_organizationId_status_idx"
  ON "ChannelMappingPreset"("organizationId", "status");

CREATE INDEX "ChannelMappingPreset_organizationId_channelCode_idx"
  ON "ChannelMappingPreset"("organizationId", "channelCode");

CREATE INDEX "ChannelMappingPreset_organizationId_costProfileId_idx"
  ON "ChannelMappingPreset"("organizationId", "costProfileId");

CREATE INDEX "ListingPrepPackage_organizationId_approvalState_idx"
  ON "ListingPrepPackage"("organizationId", "approvalState");

CREATE INDEX "ListingPrepPackage_organizationId_channelMappingPresetId_idx"
  ON "ListingPrepPackage"("organizationId", "channelMappingPresetId");

CREATE INDEX "ListingPrepPackage_organizationId_currentApprovedArtifact_idx"
  ON "ListingPrepPackage"("organizationId", "currentApprovedArtifact");

ALTER TABLE "ChannelMappingPreset"
  ADD CONSTRAINT "ChannelMappingPreset_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChannelMappingPreset"
  ADD CONSTRAINT "ChannelMappingPreset_costProfileId_fkey"
  FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingPrepPackage"
  ADD CONSTRAINT "ListingPrepPackage_channelMappingPresetId_fkey"
  FOREIGN KEY ("channelMappingPresetId") REFERENCES "ChannelMappingPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

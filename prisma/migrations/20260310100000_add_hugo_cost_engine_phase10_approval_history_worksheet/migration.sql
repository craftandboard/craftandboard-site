ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "defaultForChannel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "defaultLaunchStrategies" JSONB,
ADD COLUMN "launchContextSnapshot" JSONB,
ADD COLUMN "priority" INTEGER,
ADD COLUMN "autoApplyEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "approvalHistorySnapshot" JSONB,
ADD COLUMN "autoAppliedChannelPreset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "channelPresetSelectionSummary" JSONB,
ADD COLUMN "manualListingWorksheetSnapshot" JSONB,
ADD COLUMN "worksheetVersion" TEXT,
ADD COLUMN "worksheetSummarySnapshot" JSONB;

ALTER TABLE "CalculationScenario"
ADD COLUMN "latestPresetSelectionSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedWorksheetVersion" TEXT,
ADD COLUMN "selectedWorksheetSummarySnapshot" JSONB;

CREATE INDEX "ChannelMappingPreset_organizationId_channelCode_status_idx"
ON "ChannelMappingPreset"("organizationId", "channelCode", "status");

CREATE INDEX "ChannelMappingPreset_organizationId_defaultForChannel_idx"
ON "ChannelMappingPreset"("organizationId", "defaultForChannel");

CREATE INDEX "ListingPrepPackage_organizationId_autoAppliedChannelPreset_idx"
ON "ListingPrepPackage"("organizationId", "autoAppliedChannelPreset");

CREATE INDEX "ListingPrepPackage_organizationId_worksheetVersion_idx"
ON "ListingPrepPackage"("organizationId", "worksheetVersion");

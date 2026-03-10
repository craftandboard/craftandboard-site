ALTER TABLE "CalculationScenario"
ADD COLUMN "latestHandoffPacketSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedHandoffPacketVersion" TEXT,
ADD COLUMN "selectedHandoffPacketSummarySnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "finalHandoffPacketSnapshot" JSONB,
ADD COLUMN "entryCompleteCueSnapshot" JSONB,
ADD COLUMN "entryCompletionStatus" TEXT,
ADD COLUMN "entryCompletionSummarySnapshot" JSONB,
ADD COLUMN "handoffPacketVersion" TEXT,
ADD COLUMN "shareCopyPackagingSummary" JSONB;

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "entryCriticalOrderingSnapshot" JSONB,
ADD COLUMN "entryCompletionCueTemplateSnapshot" JSONB,
ADD COLUMN "handoffPacketFormatSnapshot" JSONB;

CREATE INDEX "ListingPrepPackage_organizationId_handoffPacketVersion_idx"
ON "ListingPrepPackage"("organizationId", "handoffPacketVersion");

CREATE INDEX "ListingPrepPackage_organizationId_entryCompletionStatus_idx"
ON "ListingPrepPackage"("organizationId", "entryCompletionStatus");

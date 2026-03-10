ALTER TABLE "CalculationScenario"
ADD COLUMN "latestRunbookSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedRunbookVersion" TEXT,
ADD COLUMN "selectedRunbookSummarySnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "finalRunbookSnapshot" JSONB,
ADD COLUMN "completionCueSnapshot" JSONB,
ADD COLUMN "internalShareSummarySnapshot" JSONB,
ADD COLUMN "shortShareTextSnapshot" JSONB,
ADD COLUMN "runbookVersion" TEXT,
ADD COLUMN "lastChangeSummarySnapshot" JSONB;

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "finalReviewOrderingSnapshot" JSONB,
ADD COLUMN "completionCueTemplateSnapshot" JSONB,
ADD COLUMN "shareSummaryFormatSnapshot" JSONB;

CREATE INDEX "ListingPrepPackage_organizationId_runbookVersion_idx"
ON "ListingPrepPackage"("organizationId", "runbookVersion");

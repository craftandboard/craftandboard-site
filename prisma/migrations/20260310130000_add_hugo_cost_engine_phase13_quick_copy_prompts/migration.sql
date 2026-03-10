ALTER TABLE "CalculationScenario"
ADD COLUMN "latestQuickCopySummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedQuickCopySummarySnapshot" JSONB,
ADD COLUMN "selectedFinalReviewPromptSnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "quickCopySummarySnapshot" JSONB,
ADD COLUMN "finalReviewPromptSnapshot" JSONB,
ADD COLUMN "artifactHandoffSummarySnapshot" JSONB,
ADD COLUMN "shortPlainTextSummarySnapshot" JSONB,
ADD COLUMN "quickCopyVersion" TEXT;

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "finalReviewPromptTemplateSnapshot" JSONB,
ADD COLUMN "quickCopyOrderingSnapshot" JSONB,
ADD COLUMN "shortSummaryFormatSnapshot" JSONB;

CREATE INDEX "ListingPrepPackage_organizationId_quickCopyVersion_idx"
ON "ListingPrepPackage"("organizationId", "quickCopyVersion");

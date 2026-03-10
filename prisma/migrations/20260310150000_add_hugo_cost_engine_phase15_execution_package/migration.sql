ALTER TABLE "CalculationScenario"
ADD COLUMN "latestExecutionSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedExecutionPackageVersion" TEXT,
ADD COLUMN "selectedExecutionPackageSummarySnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "executionPackageSnapshot" JSONB,
ADD COLUMN "lastStepChecklistSnapshot" JSONB,
ADD COLUMN "readyNowSummarySnapshot" JSONB,
ADD COLUMN "shareReadySummarySnapshot" JSONB,
ADD COLUMN "executionPackageVersion" TEXT,
ADD COLUMN "copyShareErgonomicsSummary" JSONB;

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "finalCheckOrderingSnapshot" JSONB,
ADD COLUMN "pricingCriticalPromptSnapshot" JSONB,
ADD COLUMN "sharePackagingFormatSnapshot" JSONB;

CREATE INDEX "ListingPrepPackage_organizationId_executionPackageVersion_idx"
ON "ListingPrepPackage"("organizationId", "executionPackageVersion");

CREATE TYPE "ListingReadinessStatus" AS ENUM ('READY', 'NEEDS_REVIEW', 'BLOCKED');

ALTER TABLE "CalculationScenario"
  ADD COLUMN "listingReadinessStatus" "ListingReadinessStatus",
  ADD COLUMN "listingReadinessSnapshot" JSONB,
  ADD COLUMN "marketplaceFieldSnapshot" JSONB,
  ADD COLUMN "strongerAlertSnapshot" JSONB,
  ADD COLUMN "exportSnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "selectedLaunchExportSnapshot" JSONB,
  ADD COLUMN "selectedLaunchReadinessStatus" "ListingReadinessStatus",
  ADD COLUMN "selectedLaunchWarningSnapshot" JSONB;

CREATE INDEX "CalculationScenario_organizationId_listingReadinessStatus_idx"
  ON "CalculationScenario"("organizationId", "listingReadinessStatus");

CREATE INDEX "CalculationComparisonSet_organizationId_selectedLaunchReadinessStatus_idx"
  ON "CalculationComparisonSet"("organizationId", "selectedLaunchReadinessStatus");

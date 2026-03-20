ALTER TABLE "CalculationScenario"
  ADD COLUMN "latestSupersessionSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "selectedSupersessionVersion" TEXT,
  ADD COLUMN "selectedSupersessionSummarySnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
  ADD COLUMN "postCompletionReviewSnapshot" JSONB,
  ADD COLUMN "postCompletionReviewAt" TIMESTAMP(3),
  ADD COLUMN "postCompletionReviewedByMembershipId" TEXT,
  ADD COLUMN "postCompletionReviewNote" TEXT,
  ADD COLUMN "artifactSupersessionStatus" TEXT,
  ADD COLUMN "artifactSupersessionSummarySnapshot" JSONB,
  ADD COLUMN "supersededAt" TIMESTAMP(3),
  ADD COLUMN "supersededByListingPrepPackageId" TEXT,
  ADD COLUMN "supersessionVersion" TEXT;

ALTER TABLE "ChannelMappingPreset"
  ADD COLUMN "postCompletionReviewPromptSnapshot" JSONB,
  ADD COLUMN "supersessionSummaryFormatSnapshot" JSONB;

CREATE INDEX "ListingPrepPackage_organizationId_artifactSupersessionStatus_idx"
  ON "ListingPrepPackage"("organizationId", "artifactSupersessionStatus");
CREATE INDEX "ListingPrepPackage_organizationId_supersededByListingPrepPackageId_idx"
  ON "ListingPrepPackage"("organizationId", "supersededByListingPrepPackageId");
CREATE INDEX "ListingPrepPackage_organizationId_supersededAt_idx"
  ON "ListingPrepPackage"("organizationId", "supersededAt");
CREATE INDEX "ListingPrepPackage_organizationId_supersessionVersion_idx"
  ON "ListingPrepPackage"("organizationId", "supersessionVersion");

ALTER TABLE "ListingPrepPackage"
  ADD CONSTRAINT "ListingPrepPackage_supersededByListingPrepPackageId_fkey"
  FOREIGN KEY ("supersededByListingPrepPackageId") REFERENCES "ListingPrepPackage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalculationScenario"
ADD COLUMN "latestCloseoutSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedCloseoutVersion" TEXT,
ADD COLUMN "selectedCloseoutSummarySnapshot" JSONB;

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "completionConfirmationPromptSnapshot" JSONB,
ADD COLUMN "closeoutSummaryFormatSnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "entryCompletedAt" TIMESTAMP(3),
ADD COLUMN "entryCompletedByMembershipId" TEXT,
ADD COLUMN "entryCompletionNote" TEXT,
ADD COLUMN "entryCompletionConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "closeoutSummarySnapshot" JSONB,
ADD COLUMN "closeoutVersion" TEXT,
ADD COLUMN "completedArtifactSummarySnapshot" JSONB,
ADD COLUMN "entryCompletionState" TEXT;

CREATE INDEX "ListingPrepPackage_organizationId_entryCompletionConfirmed_idx"
ON "ListingPrepPackage"("organizationId", "entryCompletionConfirmed");

CREATE INDEX "ListingPrepPackage_organizationId_entryCompletionState_idx"
ON "ListingPrepPackage"("organizationId", "entryCompletionState");

CREATE INDEX "ListingPrepPackage_organizationId_closeoutVersion_idx"
ON "ListingPrepPackage"("organizationId", "closeoutVersion");

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "worksheetFieldOrderingSnapshot" JSONB,
ADD COLUMN "worksheetPromptSnapshot" JSONB,
ADD COLUMN "requiredFieldChecklistSnapshot" JSONB,
ADD COLUMN "optionalFieldChecklistSnapshot" JSONB;

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "operatorWorksheetSnapshot" JSONB,
ADD COLUMN "operatorWorksheetVersion" TEXT,
ADD COLUMN "operatorChecklistSnapshot" JSONB,
ADD COLUMN "channelHandoffSummarySnapshot" JSONB,
ADD COLUMN "currentApprovedArtifactSummary" JSONB;

ALTER TABLE "CalculationScenario"
ADD COLUMN "latestWorksheetSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedOperatorWorksheetVersion" TEXT,
ADD COLUMN "selectedOperatorWorksheetSummarySnapshot" JSONB;

CREATE INDEX "ListingPrepPackage_organizationId_operatorWorksheetVersion_idx"
ON "ListingPrepPackage"("organizationId", "operatorWorksheetVersion");

ALTER TABLE "ListingPrepPackage"
ADD COLUMN "operatorPromptSnapshot" JSONB,
ADD COLUMN "copyExportSnapshot" JSONB,
ADD COLUMN "plainTextWorksheetSnapshot" JSONB,
ADD COLUMN "structuredWorksheetExportSnapshot" JSONB,
ADD COLUMN "worksheetErgonomicsSummary" JSONB;

ALTER TABLE "ChannelMappingPreset"
ADD COLUMN "operatorPromptTemplateSnapshot" JSONB,
ADD COLUMN "copyGroupOrderingSnapshot" JSONB,
ADD COLUMN "worksheetSectionLabelSnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
ADD COLUMN "selectedWorksheetErgonomicsSummary" JSONB;

ALTER TABLE "CalculationScenario"
ADD COLUMN "latestOperatorPromptSummarySnapshot" JSONB;

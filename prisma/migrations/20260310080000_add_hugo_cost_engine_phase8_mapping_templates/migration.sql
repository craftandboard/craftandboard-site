ALTER TABLE "CalculationScenario"
  ADD COLUMN "latestOverrideSummarySnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "selectedListingPrepReadySnapshot" JSONB,
  ADD COLUMN "selectedListingPrepExportVersion" TEXT;

ALTER TABLE "ListingPrepPackage"
  ADD COLUMN "marketplaceMappingTemplateId" TEXT,
  ADD COLUMN "exportVersion" TEXT,
  ADD COLUMN "exportShapeSnapshot" JSONB,
  ADD COLUMN "overrideHistorySnapshot" JSONB,
  ADD COLUMN "readyForListingPrep" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "readyForListingPrepSummary" JSONB;

CREATE TABLE "MarketplaceMappingTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT,
  "name" TEXT NOT NULL,
  "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "productLabelFormat" TEXT,
  "skuFormat" TEXT,
  "includeWarningNotes" BOOLEAN NOT NULL DEFAULT true,
  "includeOverrideNotes" BOOLEAN NOT NULL DEFAULT true,
  "dimensionsFormat" TEXT,
  "materialFormat" TEXT,
  "packagingFormat" TEXT,
  "pricingFormat" TEXT,
  "notes" TEXT,
  "templateSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceMappingTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceMappingTemplate_organizationId_status_idx"
  ON "MarketplaceMappingTemplate"("organizationId", "status");

CREATE INDEX "MarketplaceMappingTemplate_organizationId_costProfileId_idx"
  ON "MarketplaceMappingTemplate"("organizationId", "costProfileId");

CREATE INDEX "ListingPrepPackage_organizationId_readyForListingPrep_idx"
  ON "ListingPrepPackage"("organizationId", "readyForListingPrep");

CREATE INDEX "ListingPrepPackage_organizationId_marketplaceMappingTemplateId_idx"
  ON "ListingPrepPackage"("organizationId", "marketplaceMappingTemplateId");

ALTER TABLE "MarketplaceMappingTemplate"
  ADD CONSTRAINT "MarketplaceMappingTemplate_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MarketplaceMappingTemplate"
  ADD CONSTRAINT "MarketplaceMappingTemplate_costProfileId_fkey"
  FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingPrepPackage"
  ADD CONSTRAINT "ListingPrepPackage_marketplaceMappingTemplateId_fkey"
  FOREIGN KEY ("marketplaceMappingTemplateId") REFERENCES "MarketplaceMappingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

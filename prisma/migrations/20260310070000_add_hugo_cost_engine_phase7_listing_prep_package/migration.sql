CREATE TYPE "ListingPrepPackageStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'READY', 'BLOCKED', 'ARCHIVED');

ALTER TABLE "CalculationScenario"
  ADD COLUMN "listingPrepPackageId" TEXT,
  ADD COLUMN "priceFloorOverrideRequested" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "priceFloorOverrideApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "priceFloorOverrideSnapshot" JSONB;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "selectedListingPrepPackageId" TEXT,
  ADD COLUMN "listingPrepSummarySnapshot" JSONB;

CREATE TABLE "ListingPrepPackage" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "comparisonSetId" TEXT,
  "calculationScenarioId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ListingPrepPackageStatus" NOT NULL DEFAULT 'DRAFT',
  "listingReadinessStatus" "ListingReadinessStatus" NOT NULL,
  "exportSnapshot" JSONB NOT NULL,
  "marketplaceFieldSnapshot" JSONB NOT NULL,
  "validationSnapshot" JSONB NOT NULL,
  "warningSnapshot" JSONB,
  "overrideSnapshot" JSONB,
  "notes" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvedByMembershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ListingPrepPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalculationScenario_listingPrepPackageId_key"
  ON "CalculationScenario"("listingPrepPackageId");

CREATE INDEX "ListingPrepPackage_organizationId_status_idx"
  ON "ListingPrepPackage"("organizationId", "status");

CREATE INDEX "ListingPrepPackage_organizationId_listingReadinessStatus_idx"
  ON "ListingPrepPackage"("organizationId", "listingReadinessStatus");

CREATE INDEX "ListingPrepPackage_organizationId_calculationScenarioId_idx"
  ON "ListingPrepPackage"("organizationId", "calculationScenarioId");

CREATE INDEX "ListingPrepPackage_organizationId_comparisonSetId_idx"
  ON "ListingPrepPackage"("organizationId", "comparisonSetId");

CREATE INDEX "CalculationComparisonSet_organizationId_selectedListingPrepPackageId_idx"
  ON "CalculationComparisonSet"("organizationId", "selectedListingPrepPackageId");

ALTER TABLE "ListingPrepPackage"
  ADD CONSTRAINT "ListingPrepPackage_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ListingPrepPackage"
  ADD CONSTRAINT "ListingPrepPackage_comparisonSetId_fkey"
  FOREIGN KEY ("comparisonSetId") REFERENCES "CalculationComparisonSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingPrepPackage"
  ADD CONSTRAINT "ListingPrepPackage_calculationScenarioId_fkey"
  FOREIGN KEY ("calculationScenarioId") REFERENCES "CalculationScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CalculationScenario"
  ADD CONSTRAINT "CalculationScenario_listingPrepPackageId_fkey"
  FOREIGN KEY ("listingPrepPackageId") REFERENCES "ListingPrepPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalculationComparisonSet"
  ADD CONSTRAINT "CalculationComparisonSet_selectedListingPrepPackageId_fkey"
  FOREIGN KEY ("selectedListingPrepPackageId") REFERENCES "ListingPrepPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

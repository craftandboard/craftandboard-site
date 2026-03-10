CREATE TYPE "LaunchStrategy" AS ENUM ('BALANCED', 'AGGRESSIVE', 'SAFER_MARGIN');

ALTER TABLE "CalculationScenario"
  ADD COLUMN "launchStrategy" "LaunchStrategy",
  ADD COLUMN "rankingScore" DECIMAL(12,4),
  ADD COLUMN "rankingSummary" JSONB,
  ADD COLUMN "isRecommendedLaunchScenario" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "recommendedScenarioId" TEXT,
  ADD COLUMN "rankingSnapshot" JSONB,
  ADD COLUMN "comparisonSummary" JSONB;

CREATE TABLE "LaunchTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "defaultAmazonFeePresetId" TEXT,
  "defaultShippingZoneRuleId" TEXT,
  "defaultPackagingRuleId" TEXT,
  "defaultShippingRuleId" TEXT,
  "launchStrategy" "LaunchStrategy" NOT NULL DEFAULT 'BALANCED',
  "notes" TEXT,
  "assumptionsSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaunchTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalculationScenario_organizationId_rankingScore_idx"
  ON "CalculationScenario"("organizationId", "rankingScore");

CREATE INDEX "CalculationComparisonSet_organizationId_recommendedScenarioId_idx"
  ON "CalculationComparisonSet"("organizationId", "recommendedScenarioId");

CREATE INDEX "LaunchTemplate_organizationId_costProfileId_idx"
  ON "LaunchTemplate"("organizationId", "costProfileId");

CREATE INDEX "LaunchTemplate_organizationId_status_idx"
  ON "LaunchTemplate"("organizationId", "status");

ALTER TABLE "CalculationComparisonSet"
  ADD CONSTRAINT "CalculationComparisonSet_recommendedScenarioId_fkey"
  FOREIGN KEY ("recommendedScenarioId") REFERENCES "CalculationScenario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LaunchTemplate"
  ADD CONSTRAINT "LaunchTemplate_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LaunchTemplate"
  ADD CONSTRAINT "LaunchTemplate_costProfileId_fkey"
  FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LaunchTemplate"
  ADD CONSTRAINT "LaunchTemplate_defaultAmazonFeePresetId_fkey"
  FOREIGN KEY ("defaultAmazonFeePresetId") REFERENCES "AmazonFeePreset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LaunchTemplate"
  ADD CONSTRAINT "LaunchTemplate_defaultShippingZoneRuleId_fkey"
  FOREIGN KEY ("defaultShippingZoneRuleId") REFERENCES "ShippingZoneRule"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LaunchTemplate"
  ADD CONSTRAINT "LaunchTemplate_defaultPackagingRuleId_fkey"
  FOREIGN KEY ("defaultPackagingRuleId") REFERENCES "PackagingCostRule"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LaunchTemplate"
  ADD CONSTRAINT "LaunchTemplate_defaultShippingRuleId_fkey"
  FOREIGN KEY ("defaultShippingRuleId") REFERENCES "ShippingCostRule"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

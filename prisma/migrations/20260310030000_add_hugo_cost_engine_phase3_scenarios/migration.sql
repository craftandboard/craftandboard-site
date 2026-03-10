ALTER TABLE "ShelfCostCalculation"
ADD COLUMN "amazonFeePresetId" TEXT,
ADD COLUMN "shippingZoneRuleId" TEXT,
ADD COLUMN "referralFeeCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "closingFeeCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "fulfillmentFeeCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "storageAllowanceCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "advertisingAllowanceCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "miscMarketplaceCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "amazonFeeSnapshot" JSONB,
ADD COLUMN "shippingZoneSnapshot" JSONB;

CREATE TABLE "AmazonFeePreset" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT,
  "name" TEXT NOT NULL,
  "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "referralFeePct" DECIMAL(8,3) NOT NULL,
  "closingFeeCents" INTEGER,
  "fulfillmentFeeCents" INTEGER,
  "storageAllowanceCents" INTEGER,
  "advertisingAllowancePct" DECIMAL(8,3),
  "advertisingAllowanceCents" INTEGER,
  "returnReservePct" DECIMAL(8,3),
  "returnReserveCents" INTEGER,
  "damageReservePct" DECIMAL(8,3),
  "damageReserveCents" INTEGER,
  "miscMarketplacePct" DECIMAL(8,3),
  "miscMarketplaceCents" INTEGER,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AmazonFeePreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShippingZoneRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT,
  "name" TEXT NOT NULL,
  "zoneCode" TEXT NOT NULL,
  "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "baseCostCents" INTEGER NOT NULL,
  "weightAdderCents" INTEGER,
  "dimensionalAdderCents" INTEGER,
  "bufferPct" DECIMAL(8,3),
  "bufferCents" INTEGER,
  "marketplaceHandlingCents" INTEGER,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingZoneRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalculationScenario" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "amazonFeePresetId" TEXT,
  "shippingZoneRuleId" TEXT,
  "packagingRuleId" TEXT,
  "shippingRuleId" TEXT,
  "shelfCostCalculationId" TEXT,
  "assumptionsSnapshot" JSONB NOT NULL,
  "resultSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalculationScenario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalculationComparisonSet" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "baseShelfSpecSnapshot" JSONB NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalculationComparisonSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComparisonSetScenario" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "comparisonSetId" TEXT NOT NULL,
  "calculationScenarioId" TEXT NOT NULL,
  "sortOrder" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComparisonSetScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AmazonFeePreset_organizationId_status_idx" ON "AmazonFeePreset"("organizationId", "status");
CREATE INDEX "AmazonFeePreset_organizationId_costProfileId_idx" ON "AmazonFeePreset"("organizationId", "costProfileId");

CREATE INDEX "ShippingZoneRule_organizationId_status_idx" ON "ShippingZoneRule"("organizationId", "status");
CREATE INDEX "ShippingZoneRule_organizationId_costProfileId_idx" ON "ShippingZoneRule"("organizationId", "costProfileId");

CREATE INDEX "CalculationScenario_organizationId_createdAt_idx" ON "CalculationScenario"("organizationId", "createdAt");
CREATE INDEX "CalculationScenario_organizationId_costProfileId_idx" ON "CalculationScenario"("organizationId", "costProfileId");

CREATE INDEX "CalculationComparisonSet_organizationId_createdAt_idx" ON "CalculationComparisonSet"("organizationId", "createdAt");
CREATE INDEX "ComparisonSetScenario_organizationId_comparisonSetId_idx" ON "ComparisonSetScenario"("organizationId", "comparisonSetId");

CREATE INDEX "ShelfCostCalculation_organizationId_costProfileId_createdAt_idx" ON "ShelfCostCalculation"("organizationId", "costProfileId", "createdAt");

ALTER TABLE "AmazonFeePreset"
ADD CONSTRAINT "AmazonFeePreset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonFeePreset"
ADD CONSTRAINT "AmazonFeePreset_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShippingZoneRule"
ADD CONSTRAINT "ShippingZoneRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShippingZoneRule"
ADD CONSTRAINT "ShippingZoneRule_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_amazonFeePresetId_fkey" FOREIGN KEY ("amazonFeePresetId") REFERENCES "AmazonFeePreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_shippingZoneRuleId_fkey" FOREIGN KEY ("shippingZoneRuleId") REFERENCES "ShippingZoneRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_packagingRuleId_fkey" FOREIGN KEY ("packagingRuleId") REFERENCES "PackagingCostRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_shippingRuleId_fkey" FOREIGN KEY ("shippingRuleId") REFERENCES "ShippingCostRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculationScenario"
ADD CONSTRAINT "CalculationScenario_shelfCostCalculationId_fkey" FOREIGN KEY ("shelfCostCalculationId") REFERENCES "ShelfCostCalculation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalculationComparisonSet"
ADD CONSTRAINT "CalculationComparisonSet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComparisonSetScenario"
ADD CONSTRAINT "ComparisonSetScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComparisonSetScenario"
ADD CONSTRAINT "ComparisonSetScenario_comparisonSetId_fkey" FOREIGN KEY ("comparisonSetId") REFERENCES "CalculationComparisonSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComparisonSetScenario"
ADD CONSTRAINT "ComparisonSetScenario_calculationScenarioId_fkey" FOREIGN KEY ("calculationScenarioId") REFERENCES "CalculationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShelfCostCalculation"
ADD CONSTRAINT "ShelfCostCalculation_amazonFeePresetId_fkey" FOREIGN KEY ("amazonFeePresetId") REFERENCES "AmazonFeePreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShelfCostCalculation"
ADD CONSTRAINT "ShelfCostCalculation_shippingZoneRuleId_fkey" FOREIGN KEY ("shippingZoneRuleId") REFERENCES "ShippingZoneRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

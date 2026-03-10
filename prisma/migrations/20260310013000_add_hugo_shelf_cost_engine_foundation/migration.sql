CREATE TYPE "CostProfileStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ShelfCostEdgeBandPattern" AS ENUM ('NONE', 'LONG_EDGES', 'SHORT_EDGES', 'ALL_FOUR');

ALTER TABLE "CostProfile"
ADD COLUMN "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "defaultMaterialWastePct" DECIMAL(8,3) NOT NULL DEFAULT 10,
ADD COLUMN "defaultEdgeBandWastePct" DECIMAL(8,3) NOT NULL DEFAULT 8,
ADD COLUMN "defaultLaborRateCentsPerHour" INTEGER NOT NULL DEFAULT 4500,
ADD COLUMN "defaultMachineRateCentsPerHour" INTEGER NOT NULL DEFAULT 7200,
ADD COLUMN "defaultOverheadRateCentsPerHour" INTEGER DEFAULT 1800,
ADD COLUMN "defaultPackagingAllowanceCents" INTEGER DEFAULT 0,
ADD COLUMN "defaultShippingAllowanceCents" INTEGER DEFAULT 0,
ADD COLUMN "targetMarginPct" DECIMAL(8,3) DEFAULT 20,
ADD COLUMN "growthMarginPct" DECIMAL(8,3) DEFAULT 10,
ADD COLUMN "metadata" JSONB;

CREATE INDEX "CostProfile_organizationId_status_idx" ON "CostProfile"("organizationId", "status");

CREATE TABLE "MaterialCostRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "materialCode" TEXT NOT NULL,
  "materialName" TEXT NOT NULL,
  "thicknessLabel" TEXT,
  "sheetLengthIn" DECIMAL(8,3) NOT NULL,
  "sheetWidthIn" DECIMAL(8,3) NOT NULL,
  "sheetCostCents" INTEGER NOT NULL,
  "usableYieldPct" DECIMAL(8,3),
  "wastePct" DECIMAL(8,3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MaterialCostRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EdgeBandCostRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "edgeBandCode" TEXT NOT NULL,
  "edgeBandName" TEXT NOT NULL,
  "costCentsPerLinearFoot" INTEGER NOT NULL,
  "wastePct" DECIMAL(8,3),
  "setupAllowanceLinearFt" DECIMAL(8,3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EdgeBandCostRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackagingCostRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "packagingCode" TEXT NOT NULL,
  "packagingName" TEXT NOT NULL,
  "boxCostCents" INTEGER,
  "bubbleWrapCostCents" INTEGER,
  "tapeCostCents" INTEGER,
  "labelCostCents" INTEGER,
  "insertFlyerCostCents" INTEGER,
  "shrinkWrapCostCents" INTEGER,
  "otherPackagingCostCents" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PackagingCostRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShippingCostRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "shippingCode" TEXT NOT NULL,
  "shippingName" TEXT NOT NULL,
  "baseCostCents" INTEGER NOT NULL,
  "costPerPoundCents" INTEGER,
  "costPerCubicInchCents" INTEGER,
  "flatOverride" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShippingCostRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShelfCostCalculation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT NOT NULL,
  "name" TEXT,
  "sku" TEXT,
  "quantity" INTEGER NOT NULL,
  "lengthIn" DECIMAL(8,3) NOT NULL,
  "depthIn" DECIMAL(8,3) NOT NULL,
  "thicknessIn" DECIMAL(8,3),
  "materialCode" TEXT NOT NULL,
  "edgeBandCode" TEXT,
  "edgeBandPattern" "ShelfCostEdgeBandPattern" NOT NULL,
  "packagingCode" TEXT,
  "shippingCode" TEXT,
  "laborMinutes" DECIMAL(8,3) NOT NULL,
  "machineMinutes" DECIMAL(8,3) NOT NULL,
  "overheadMinutes" DECIMAL(8,3),
  "materialCostCents" INTEGER NOT NULL,
  "edgeBandCostCents" INTEGER NOT NULL,
  "laborCostCents" INTEGER NOT NULL,
  "machineCostCents" INTEGER NOT NULL,
  "packagingCostCents" INTEGER NOT NULL,
  "shippingCostCents" INTEGER NOT NULL,
  "overheadCostCents" INTEGER NOT NULL,
  "subtotalCostCents" INTEGER NOT NULL,
  "targetMarginPct" DECIMAL(8,3),
  "growthMarginPct" DECIMAL(8,3),
  "recommendedInternalPriceCents" INTEGER,
  "recommendedSellPriceCents" INTEGER,
  "assumptionsSnapshot" JSONB NOT NULL,
  "resultSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShelfCostCalculation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaterialCostRule_organizationId_costProfileId_idx" ON "MaterialCostRule"("organizationId", "costProfileId");
CREATE INDEX "MaterialCostRule_organizationId_materialCode_idx" ON "MaterialCostRule"("organizationId", "materialCode");
CREATE INDEX "EdgeBandCostRule_organizationId_costProfileId_idx" ON "EdgeBandCostRule"("organizationId", "costProfileId");
CREATE INDEX "EdgeBandCostRule_organizationId_edgeBandCode_idx" ON "EdgeBandCostRule"("organizationId", "edgeBandCode");
CREATE INDEX "PackagingCostRule_organizationId_costProfileId_idx" ON "PackagingCostRule"("organizationId", "costProfileId");
CREATE INDEX "PackagingCostRule_organizationId_packagingCode_idx" ON "PackagingCostRule"("organizationId", "packagingCode");
CREATE INDEX "ShippingCostRule_organizationId_costProfileId_idx" ON "ShippingCostRule"("organizationId", "costProfileId");
CREATE INDEX "ShippingCostRule_organizationId_shippingCode_idx" ON "ShippingCostRule"("organizationId", "shippingCode");
CREATE INDEX "ShelfCostCalculation_organizationId_costProfileId_createdAt_idx" ON "ShelfCostCalculation"("organizationId", "costProfileId", "createdAt");

ALTER TABLE "MaterialCostRule"
ADD CONSTRAINT "MaterialCostRule_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaterialCostRule"
ADD CONSTRAINT "MaterialCostRule_costProfileId_fkey"
FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EdgeBandCostRule"
ADD CONSTRAINT "EdgeBandCostRule_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EdgeBandCostRule"
ADD CONSTRAINT "EdgeBandCostRule_costProfileId_fkey"
FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PackagingCostRule"
ADD CONSTRAINT "PackagingCostRule_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PackagingCostRule"
ADD CONSTRAINT "PackagingCostRule_costProfileId_fkey"
FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShippingCostRule"
ADD CONSTRAINT "ShippingCostRule_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShippingCostRule"
ADD CONSTRAINT "ShippingCostRule_costProfileId_fkey"
FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShelfCostCalculation"
ADD CONSTRAINT "ShelfCostCalculation_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShelfCostCalculation"
ADD CONSTRAINT "ShelfCostCalculation_costProfileId_fkey"
FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

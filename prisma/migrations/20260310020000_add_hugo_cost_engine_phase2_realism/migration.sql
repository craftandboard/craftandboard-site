ALTER TABLE "CostProfile"
ADD COLUMN "defaultPackingLaborRateCentsPerHour" INTEGER DEFAULT 4500,
ADD COLUMN "defaultPackingMinutes" DECIMAL(8,3) DEFAULT 6,
ADD COLUMN "defaultMarketplaceFeePct" DECIMAL(8,3) DEFAULT 15,
ADD COLUMN "defaultReturnReservePct" DECIMAL(8,3) DEFAULT 2,
ADD COLUMN "defaultDamageReservePct" DECIMAL(8,3) DEFAULT 1,
ADD COLUMN "defaultShippingBufferPct" DECIMAL(8,3) DEFAULT 5,
ADD COLUMN "defaultShippingBufferCents" INTEGER DEFAULT 0,
ADD COLUMN "defaultPackagingOverheadCents" INTEGER DEFAULT 0,
ADD COLUMN "defaultRecommendedMinMarginPct" DECIMAL(8,3) DEFAULT 10,
ADD COLUMN "defaultRecommendedTargetMarginPct" DECIMAL(8,3) DEFAULT 20;

ALTER TABLE "PackagingCostRule"
ADD COLUMN "foamCostCents" INTEGER,
ADD COLUMN "cornerProtectorCostCents" INTEGER,
ADD COLUMN "packingMinutes" DECIMAL(8,3),
ADD COLUMN "packingLaborOverrideCents" INTEGER,
ADD COLUMN "packagingOverheadCents" INTEGER,
ADD COLUMN "sortOrder" INTEGER;

ALTER TABLE "ShippingCostRule"
ADD COLUMN "dimensionalDivisor" DECIMAL(10,3),
ADD COLUMN "dimensionalRateCents" INTEGER,
ADD COLUMN "shippingBufferPct" DECIMAL(8,3),
ADD COLUMN "shippingBufferCents" INTEGER,
ADD COLUMN "marketplaceHandlingCents" INTEGER,
ADD COLUMN "sortOrder" INTEGER;

ALTER TABLE "ShelfCostCalculation"
ADD COLUMN "packingMinutes" DECIMAL(8,3),
ADD COLUMN "packingLaborCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "shippingBufferCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "marketplaceFeeCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "returnReserveCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "damageReserveCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "breakEvenPriceCents" INTEGER,
ADD COLUMN "recommendedMinSellPriceCents" INTEGER,
ADD COLUMN "recommendedTargetSellPriceCents" INTEGER,
ADD COLUMN "packagingSnapshot" JSONB,
ADD COLUMN "shippingSnapshot" JSONB,
ADD COLUMN "pricingSnapshot" JSONB;

CREATE TYPE "CostEstimateStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'ERROR');

CREATE TABLE "ShelfCostEstimate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shelfJobId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "costProfileId" TEXT NOT NULL,
    "productionAssumptionProfileId" TEXT NOT NULL,
    "packagingProfileId" TEXT,
    "pricingPolicyId" TEXT NOT NULL,
    "estimateStatus" "CostEstimateStatus" NOT NULL DEFAULT 'COMPLETE',
    "warningsJson" JSONB,
    "inputSnapshotJson" JSONB NOT NULL,
    "assumptionSnapshotJson" JSONB NOT NULL,
    "resultJson" JSONB NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShelfCostEstimate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderCostEstimate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "costProfileId" TEXT NOT NULL,
    "productionAssumptionProfileId" TEXT,
    "packagingProfileId" TEXT,
    "pricingPolicyId" TEXT,
    "estimateStatus" "CostEstimateStatus" NOT NULL DEFAULT 'COMPLETE',
    "warningsJson" JSONB,
    "inputSnapshotJson" JSONB NOT NULL,
    "assumptionSnapshotJson" JSONB NOT NULL,
    "resultJson" JSONB NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCostEstimate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShelfCostEstimate_organizationId_shelfJobId_createdAt_idx" ON "ShelfCostEstimate"("organizationId", "shelfJobId", "createdAt");
CREATE INDEX "ShelfCostEstimate_organizationId_salesOrderId_createdAt_idx" ON "ShelfCostEstimate"("organizationId", "salesOrderId", "createdAt");
CREATE INDEX "ShelfCostEstimate_organizationId_salesOrderItemId_createdAt_idx" ON "ShelfCostEstimate"("organizationId", "salesOrderItemId", "createdAt");
CREATE INDEX "ShelfCostEstimate_organizationId_isCurrent_createdAt_idx" ON "ShelfCostEstimate"("organizationId", "isCurrent", "createdAt");

CREATE INDEX "OrderCostEstimate_organizationId_salesOrderId_createdAt_idx" ON "OrderCostEstimate"("organizationId", "salesOrderId", "createdAt");
CREATE INDEX "OrderCostEstimate_organizationId_isCurrent_createdAt_idx" ON "OrderCostEstimate"("organizationId", "isCurrent", "createdAt");

ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_shelfJobId_fkey" FOREIGN KEY ("shelfJobId") REFERENCES "ShelfJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_productionAssumptionProfileId_fkey" FOREIGN KEY ("productionAssumptionProfileId") REFERENCES "ProductionAssumptionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_packagingProfileId_fkey" FOREIGN KEY ("packagingProfileId") REFERENCES "PackagingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_pricingPolicyId_fkey" FOREIGN KEY ("pricingPolicyId") REFERENCES "PricingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfCostEstimate" ADD CONSTRAINT "ShelfCostEstimate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_productionAssumptionProfileId_fkey" FOREIGN KEY ("productionAssumptionProfileId") REFERENCES "ProductionAssumptionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_packagingProfileId_fkey" FOREIGN KEY ("packagingProfileId") REFERENCES "PackagingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_pricingPolicyId_fkey" FOREIGN KEY ("pricingPolicyId") REFERENCES "PricingPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderCostEstimate" ADD CONSTRAINT "OrderCostEstimate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

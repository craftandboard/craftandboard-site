-- CreateEnum
CREATE TYPE "PricingRoundingMode" AS ENUM ('NONE', 'NEAREST', 'UP');

-- CreateTable
CREATE TABLE "ShelfProduct" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "materialType" "MaterialCode" NOT NULL,
    "defaultThicknessIn" DECIMAL(8,3) NOT NULL,
    "defaultEdgeBandPattern" "EdgeBandPattern" NOT NULL,
    "packagingProfileId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShelfProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionAssumptionProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "cncLoadMinutesPerRun" DECIMAL(8,3) NOT NULL,
    "cncUnloadMinutesPerRun" DECIMAL(8,3) NOT NULL,
    "cncRunMinutesPerUnit" DECIMAL(8,3) NOT NULL,
    "edgebanderSetupMinutesPerRun" DECIMAL(8,3) NOT NULL,
    "edgebanderRunMinutesPerLinearFt" DECIMAL(8,3) NOT NULL,
    "handlingMinutesPerUnit" DECIMAL(8,3) NOT NULL,
    "packagingMinutesPerUnit" DECIMAL(8,3) NOT NULL,
    "qcMinutesPerUnit" DECIMAL(8,3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionAssumptionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boxCostCentsPerUnit" INTEGER NOT NULL,
    "bubbleWrapCostCentsPerUnit" INTEGER NOT NULL,
    "shrinkWrapCostCentsPerUnit" INTEGER NOT NULL,
    "tapeCostCentsPerUnit" INTEGER NOT NULL,
    "labelCostCentsPerUnit" INTEGER NOT NULL,
    "insertFlyerCostCentsPerUnit" INTEGER NOT NULL,
    "otherPackagingCostCentsPerUnit" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "manufacturingMarkupPercent" DECIMAL(8,3) NOT NULL,
    "minimumChargeCentsPerUnit" INTEGER,
    "minimumRunChargeCents" INTEGER,
    "roundingMode" "PricingRoundingMode" NOT NULL DEFAULT 'NONE',
    "roundToCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingScenario" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shelfProductId" TEXT,
    "costProfileId" TEXT NOT NULL,
    "productionAssumptionProfileId" TEXT NOT NULL,
    "packagingProfileId" TEXT,
    "pricingPolicyId" TEXT NOT NULL,
    "inputJson" JSONB NOT NULL,
    "resultJson" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShelfProduct_organizationId_code_key" ON "ShelfProduct"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ShelfProduct_organizationId_isActive_idx" ON "ShelfProduct"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ProductionAssumptionProfile_organizationId_isDefault_idx" ON "ProductionAssumptionProfile"("organizationId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionAssumptionProfile_organizationId_name_key" ON "ProductionAssumptionProfile"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingProfile_organizationId_name_key" ON "PackagingProfile"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PackagingProfile_organizationId_isActive_idx" ON "PackagingProfile"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "PricingPolicy_organizationId_isDefault_idx" ON "PricingPolicy"("organizationId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPolicy_organizationId_name_key" ON "PricingPolicy"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PricingScenario_organizationId_createdAt_idx" ON "PricingScenario"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PricingScenario_organizationId_pricingPolicyId_createdAt_idx" ON "PricingScenario"("organizationId", "pricingPolicyId", "createdAt");

-- CreateIndex
CREATE INDEX "PricingScenario_createdByUserId_idx" ON "PricingScenario"("createdByUserId");

-- AddForeignKey
ALTER TABLE "ShelfProduct" ADD CONSTRAINT "ShelfProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfProduct" ADD CONSTRAINT "ShelfProduct_packagingProfileId_fkey" FOREIGN KEY ("packagingProfileId") REFERENCES "PackagingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionAssumptionProfile" ADD CONSTRAINT "ProductionAssumptionProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingProfile" ADD CONSTRAINT "PackagingProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPolicy" ADD CONSTRAINT "PricingPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_shelfProductId_fkey" FOREIGN KEY ("shelfProductId") REFERENCES "ShelfProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_productionAssumptionProfileId_fkey" FOREIGN KEY ("productionAssumptionProfileId") REFERENCES "ProductionAssumptionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_packagingProfileId_fkey" FOREIGN KEY ("packagingProfileId") REFERENCES "PackagingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_pricingPolicyId_fkey" FOREIGN KEY ("pricingPolicyId") REFERENCES "PricingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

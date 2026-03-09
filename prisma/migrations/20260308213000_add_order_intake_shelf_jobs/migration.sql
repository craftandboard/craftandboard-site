-- CreateEnum
CREATE TYPE "SalesOrderSourceType" AS ENUM ('MANUAL', 'AMAZON', 'CSV', 'CONFIGURATOR');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'READY', 'HOLD', 'ERROR', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SalesOrderItemNormalizationStatus" AS ENUM ('PENDING', 'NORMALIZED', 'HOLD', 'ERROR');

-- CreateEnum
CREATE TYPE "SalesOrderItemPricingStatus" AS ENUM ('PENDING', 'PRICED', 'HOLD', 'ERROR');

-- CreateEnum
CREATE TYPE "ShelfJobStatus" AS ENUM ('READY', 'HOLD', 'ERROR', 'CONVERTED_TO_MANUFACTURING');

-- CreateEnum
CREATE TYPE "ManufacturingPacketSourceType" AS ENUM ('SALES_ORDER', 'SHELF_JOB');

-- CreateTable
CREATE TABLE "SalesOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sourceType" "SalesOrderSourceType" NOT NULL,
  "sourceOrderId" TEXT,
  "sourceStatus" TEXT,
  "customerName" TEXT,
  "customerEmail" TEXT,
  "shipToName" TEXT,
  "shipToAddressJson" JSONB,
  "orderedAt" TIMESTAMP(3),
  "currency" TEXT NOT NULL,
  "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "sourceLineId" TEXT,
  "shelfProductId" TEXT,
  "sku" TEXT,
  "title" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lengthIn" DECIMAL(8,3),
  "depthIn" DECIMAL(8,3),
  "thicknessIn" DECIMAL(8,3),
  "materialType" "MaterialCode",
  "edgeBandPattern" "EdgeBandPattern",
  "requiresPackaging" BOOLEAN NOT NULL DEFAULT true,
  "packagingProfileId" TEXT,
  "customizationJson" JSONB,
  "normalizedSpecJson" JSONB,
  "normalizationStatus" "SalesOrderItemNormalizationStatus" NOT NULL DEFAULT 'PENDING',
  "normalizationErrorsJson" JSONB,
  "pricingStatus" "SalesOrderItemPricingStatus" NOT NULL DEFAULT 'PENDING',
  "pricingSnapshotJson" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "salesOrderItemId" TEXT NOT NULL,
  "shelfProductId" TEXT,
  "costProfileId" TEXT NOT NULL,
  "productionAssumptionProfileId" TEXT NOT NULL,
  "packagingProfileId" TEXT,
  "pricingPolicyId" TEXT NOT NULL,
  "pricingScenarioId" TEXT,
  "normalizedSpecJson" JSONB NOT NULL,
  "quantity" INTEGER NOT NULL,
  "jobStatus" "ShelfJobStatus" NOT NULL DEFAULT 'READY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShelfJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingPacket" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "packetNumber" TEXT NOT NULL,
  "sourceType" "ManufacturingPacketSourceType" NOT NULL,
  "sourceIdsJson" JSONB NOT NULL,
  "summaryJson" JSONB NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManufacturingPacket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesOrder_organizationId_status_createdAt_idx" ON "SalesOrder"("organizationId", "status", "createdAt");
CREATE INDEX "SalesOrder_organizationId_sourceType_createdAt_idx" ON "SalesOrder"("organizationId", "sourceType", "createdAt");
CREATE INDEX "SalesOrder_organizationId_sourceOrderId_idx" ON "SalesOrder"("organizationId", "sourceOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_organizationId_salesOrderId_createdAt_idx" ON "SalesOrderItem"("organizationId", "salesOrderId", "createdAt");
CREATE INDEX "SalesOrderItem_organizationId_normalizationStatus_pricingStatus_idx" ON "SalesOrderItem"("organizationId", "normalizationStatus", "pricingStatus");
CREATE INDEX "SalesOrderItem_organizationId_sourceLineId_idx" ON "SalesOrderItem"("organizationId", "sourceLineId");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfJob_salesOrderItemId_key" ON "ShelfJob"("salesOrderItemId");
CREATE INDEX "ShelfJob_organizationId_jobStatus_createdAt_idx" ON "ShelfJob"("organizationId", "jobStatus", "createdAt");
CREATE INDEX "ShelfJob_organizationId_salesOrderId_idx" ON "ShelfJob"("organizationId", "salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingPacket_organizationId_packetNumber_key" ON "ManufacturingPacket"("organizationId", "packetNumber");
CREATE INDEX "ManufacturingPacket_organizationId_createdAt_idx" ON "ManufacturingPacket"("organizationId", "createdAt");
CREATE INDEX "ManufacturingPacket_createdByUserId_idx" ON "ManufacturingPacket"("createdByUserId");

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_shelfProductId_fkey" FOREIGN KEY ("shelfProductId") REFERENCES "ShelfProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_packagingProfileId_fkey" FOREIGN KEY ("packagingProfileId") REFERENCES "PackagingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_shelfProductId_fkey" FOREIGN KEY ("shelfProductId") REFERENCES "ShelfProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_productionAssumptionProfileId_fkey" FOREIGN KEY ("productionAssumptionProfileId") REFERENCES "ProductionAssumptionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_packagingProfileId_fkey" FOREIGN KEY ("packagingProfileId") REFERENCES "PackagingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_pricingPolicyId_fkey" FOREIGN KEY ("pricingPolicyId") REFERENCES "PricingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_pricingScenarioId_fkey" FOREIGN KEY ("pricingScenarioId") REFERENCES "PricingScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPacket" ADD CONSTRAINT "ManufacturingPacket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ManufacturingPacket" ADD CONSTRAINT "ManufacturingPacket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

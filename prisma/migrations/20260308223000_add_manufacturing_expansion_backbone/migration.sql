-- CreateEnum
CREATE TYPE "ManufacturingPartStatus" AS ENUM ('READY_FOR_BATCH', 'BATCHED', 'CUT_PENDING', 'CUT_IN_PROGRESS', 'CUT_COMPLETE', 'EDGEBAND_PENDING', 'EDGEBAND_IN_PROGRESS', 'EDGEBAND_COMPLETE', 'PACKAGING_PENDING', 'PACKAGING_IN_PROGRESS', 'PACKAGED', 'HOLD', 'ERROR');

-- CreateEnum
CREATE TYPE "ManufacturingPartType" AS ENUM ('SHELF');

-- CreateEnum
CREATE TYPE "ManufacturingBatchType" AS ENUM ('CUT', 'EDGEBAND', 'PACKAGING');

-- CreateEnum
CREATE TYPE "ManufacturingBatchStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETE', 'HOLD');

-- AlterTable
ALTER TABLE "ShelfJob" ADD COLUMN     "manufacturingPacketId" TEXT;

-- CreateTable
CREATE TABLE "ManufacturingPart" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "manufacturingPacketId" TEXT NOT NULL,
    "shelfJobId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "batchId" TEXT,
    "partNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "unitIndex" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "partType" "ManufacturingPartType" NOT NULL DEFAULT 'SHELF',
    "materialType" "MaterialCode" NOT NULL,
    "thicknessIn" DECIMAL(8,3) NOT NULL,
    "lengthIn" DECIMAL(8,3) NOT NULL,
    "depthIn" DECIMAL(8,3) NOT NULL,
    "edgeBandPattern" "EdgeBandPattern" NOT NULL,
    "requiresPackaging" BOOLEAN NOT NULL DEFAULT true,
    "labelDataJson" JSONB NOT NULL,
    "status" "ManufacturingPartStatus" NOT NULL DEFAULT 'READY_FOR_BATCH',
    "statusReason" TEXT,
    "sortGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "batchType" "ManufacturingBatchType" NOT NULL,
    "materialType" "MaterialCode",
    "thicknessIn" DECIMAL(8,3),
    "status" "ManufacturingBatchStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingBatchPart" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "manufacturingPartId" TEXT NOT NULL,
    "sequence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingBatchPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelTemplateVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "templateJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacketExpansionRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "manufacturingPacketId" TEXT NOT NULL,
    "sourceJobCount" INTEGER NOT NULL,
    "createdPartCount" INTEGER NOT NULL,
    "resultJson" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PacketExpansionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_status_createdAt_idx" ON "ManufacturingPart"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_manufacturingPacketId_idx" ON "ManufacturingPart"("organizationId", "manufacturingPacketId");

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_shelfJobId_idx" ON "ManufacturingPart"("organizationId", "shelfJobId");

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_salesOrderId_idx" ON "ManufacturingPart"("organizationId", "salesOrderId");

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_salesOrderItemId_idx" ON "ManufacturingPart"("organizationId", "salesOrderItemId");

-- CreateIndex
CREATE INDEX "ManufacturingPart_organizationId_batchId_idx" ON "ManufacturingPart"("organizationId", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingPart_organizationId_partNumber_key" ON "ManufacturingPart"("organizationId", "partNumber");

-- CreateIndex
CREATE INDEX "ManufacturingBatch_organizationId_batchType_status_createdA_idx" ON "ManufacturingBatch"("organizationId", "batchType", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingBatch_organizationId_batchNumber_key" ON "ManufacturingBatch"("organizationId", "batchNumber");

-- CreateIndex
CREATE INDEX "ManufacturingBatchPart_organizationId_batchId_createdAt_idx" ON "ManufacturingBatchPart"("organizationId", "batchId", "createdAt");

-- CreateIndex
CREATE INDEX "ManufacturingBatchPart_organizationId_manufacturingPartId_idx" ON "ManufacturingBatchPart"("organizationId", "manufacturingPartId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingBatchPart_batchId_manufacturingPartId_key" ON "ManufacturingBatchPart"("batchId", "manufacturingPartId");

-- CreateIndex
CREATE INDEX "LabelTemplateVersion_organizationId_isDefault_createdAt_idx" ON "LabelTemplateVersion"("organizationId", "isDefault", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabelTemplateVersion_organizationId_code_version_key" ON "LabelTemplateVersion"("organizationId", "code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PacketExpansionRun_manufacturingPacketId_key" ON "PacketExpansionRun"("manufacturingPacketId");

-- CreateIndex
CREATE INDEX "PacketExpansionRun_organizationId_createdAt_idx" ON "PacketExpansionRun"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PacketExpansionRun_createdByUserId_idx" ON "PacketExpansionRun"("createdByUserId");

-- CreateIndex
CREATE INDEX "ShelfJob_organizationId_manufacturingPacketId_idx" ON "ShelfJob"("organizationId", "manufacturingPacketId");

-- AddForeignKey
ALTER TABLE "ShelfJob" ADD CONSTRAINT "ShelfJob_manufacturingPacketId_fkey" FOREIGN KEY ("manufacturingPacketId") REFERENCES "ManufacturingPacket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_manufacturingPacketId_fkey" FOREIGN KEY ("manufacturingPacketId") REFERENCES "ManufacturingPacket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_shelfJobId_fkey" FOREIGN KEY ("shelfJobId") REFERENCES "ShelfJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingPart" ADD CONSTRAINT "ManufacturingPart_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ManufacturingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingBatch" ADD CONSTRAINT "ManufacturingBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingBatchPart" ADD CONSTRAINT "ManufacturingBatchPart_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingBatchPart" ADD CONSTRAINT "ManufacturingBatchPart_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ManufacturingBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingBatchPart" ADD CONSTRAINT "ManufacturingBatchPart_manufacturingPartId_fkey" FOREIGN KEY ("manufacturingPartId") REFERENCES "ManufacturingPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelTemplateVersion" ADD CONSTRAINT "LabelTemplateVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacketExpansionRun" ADD CONSTRAINT "PacketExpansionRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacketExpansionRun" ADD CONSTRAINT "PacketExpansionRun_manufacturingPacketId_fkey" FOREIGN KEY ("manufacturingPacketId") REFERENCES "ManufacturingPacket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacketExpansionRun" ADD CONSTRAINT "PacketExpansionRun_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


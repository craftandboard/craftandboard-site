-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MaterialCode" AS ENUM ('WHITE_MELAMINE', 'MAPLE_MELAMINE', 'BIRCH_18', 'WALNUT_18', 'MAPLE_18', 'MDF_18');

-- CreateEnum
CREATE TYPE "EdgeBandPattern" AS ENUM ('ALL_FOUR');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'IMPORTED', 'READY_FOR_BATCH', 'RECEIVED', 'IN_PRODUCTION', 'READY_FOR_SHIPMENT', 'SHIPPED', 'COMPLETE', 'HOLD', 'ERROR');

-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('PENDING', 'READY_FOR_BATCH', 'BATCHED', 'CUT', 'EDGEBANDED', 'PACKED', 'HOLD', 'ERROR');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'PLANNED', 'RELEASED', 'CUTTING', 'CUT_COMPLETE', 'READY_FOR_NEXT_STAGE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ProductionBundleStatus" AS ENUM ('DRAFT', 'READY_FOR_NESTING', 'NESTED', 'READY_FOR_CNC', 'CNC_GENERATED', 'APPROVED_FOR_PRODUCTION', 'IN_PRODUCTION', 'CUT_COMPLETE', 'QC_HOLD', 'PACKED', 'SHIPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "SheetStatus" AS ENUM ('PLANNED', 'POSTED', 'CUTTING', 'CUT_COMPLETE', 'QC_HOLD', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "CncJobStatus" AS ENUM ('GENERATED', 'APPROVED', 'POSTED', 'RAN', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('SHEET_MAP_SVG', 'SHEET_MAP_HTML', 'CNC_FILE', 'BUNDLE_PACKET_HTML');

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('AMAZON', 'WEBSITE', 'MANUAL');

-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('SCAN', 'ASSEMBLY', 'PACK', 'SHIP');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'READY', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('CONFIGURATOR', 'AMAZON');

-- CreateEnum
CREATE TYPE "ManufacturingJobStatus" AS ENUM ('DRAFT', 'COMPLETE');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ContainerType" AS ENUM ('CONTAINER', 'BIN');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('OPEN', 'SORTING', 'COMPLETE', 'HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "RemnantStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'PARTIAL', 'CONSUMED', 'HOLD', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "RemnantSourceType" AS ENUM ('FULL_SHEET_LEFTOVER', 'MANUAL', 'IMPORTED');

-- CreateEnum
CREATE TYPE "RemnantUsageActionType" AS ENUM ('CREATED', 'RESERVED', 'CONSUMED', 'PARTIAL_CONSUME', 'RELEASED', 'SCRAPPED', 'HOLD', 'UPDATED');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('CNC', 'EDGEBANDER', 'LABEL_PRINTER', 'SCANNER_STATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'HOLD', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "MachineEventSourceType" AS ENUM ('MANUAL_SIMULATION', 'API', 'FILE_IMPORT', 'PLC_BRIDGE', 'WEBHOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "MachineEventProcessingStatus" AS ENUM ('RECEIVED', 'PARSED', 'LINKED', 'UNMATCHED', 'ERROR');

-- CreateEnum
CREATE TYPE "StageCandidateTargetType" AS ENUM ('PART', 'BATCH', 'MANUFACTURING_JOB');

-- CreateEnum
CREATE TYPE "StageCandidateStatus" AS ENUM ('OPEN', 'APPLIED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "StageCandidateAction" AS ENUM ('MARK_PART_CUT', 'MARK_PART_EDGEBANDED', 'MARK_BATCH_CUT_IN_PROGRESS', 'MARK_BATCH_CUT_COMPLETE', 'MARK_JOB_EDGE_IN_PROGRESS', 'MARK_JOB_EDGE_COMPLETE');

-- CreateEnum
CREATE TYPE "StageCandidateConfidence" AS ENUM ('HIGH', 'MEDIUM');

-- CreateEnum
CREATE TYPE "StageCandidateAppliedMode" AS ENUM ('MANUAL', 'AUTO');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalRef" TEXT,
    "externalOrderId" TEXT,
    "amazonOrderId" TEXT,
    "amazonOrderSource" TEXT,
    "orderDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "shipByDate" TIMESTAMP(3),
    "customerName" TEXT NOT NULL,
    "customerFullName" TEXT,
    "shipToName" TEXT,
    "customerLastName" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "SalesChannel" NOT NULL DEFAULT 'MANUAL',
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "orderId" TEXT NOT NULL,
    "externalOrderItemId" TEXT,
    "amazonOrderItemId" TEXT,
    "asin" TEXT,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productLabel" TEXT NOT NULL,
    "normalizedLegacyXmlName" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "materialCode" "MaterialCode",
    "edgeBandPattern" "EdgeBandPattern" NOT NULL DEFAULT 'ALL_FOUR',
    "widthIn" DECIMAL(8,3) NOT NULL,
    "depthIn" DECIMAL(8,3) NOT NULL,
    "thicknessIn" DECIMAL(8,3) NOT NULL,
    "sourceLengthIn" DECIMAL(8,3),
    "sourceDepthIn" DECIMAL(8,3),
    "sourceEdgeBandText" TEXT,
    "sourceCustomizationJson" JSONB,
    "notes" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "orderItemId" TEXT,
    "batchId" TEXT,
    "currentContainerId" TEXT,
    "orderId" TEXT,
    "manufacturingJobId" TEXT,
    "scanCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "serialNumber" INTEGER,
    "instanceNumber" INTEGER NOT NULL DEFAULT 1,
    "materialCode" "MaterialCode",
    "edgeBandPattern" "EdgeBandPattern" NOT NULL DEFAULT 'ALL_FOUR',
    "widthIn" DECIMAL(8,3) NOT NULL,
    "depthIn" DECIMAL(8,3) NOT NULL,
    "thicknessIn" DECIMAL(8,3) NOT NULL,
    "shipByDate" TIMESTAMP(3),
    "customerLastName" TEXT,
    "status" "PartStatus" NOT NULL DEFAULT 'READY_FOR_BATCH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "batchId" TEXT,
    "source" "JobSource" NOT NULL DEFAULT 'CONFIGURATOR',
    "status" "ManufacturingJobStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "SalesChannel" NOT NULL,
    "partType" TEXT NOT NULL,
    "materialCode" "MaterialCode" NOT NULL,
    "edgeBandPattern" "EdgeBandPattern" NOT NULL DEFAULT 'ALL_FOUR',
    "widthIn" DECIMAL(8,3) NOT NULL,
    "depthIn" DECIMAL(8,3) NOT NULL,
    "thicknessIn" DECIMAL(8,3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'IN',
    "manufacturingMode" TEXT NOT NULL,
    "labelCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "materialCode" "MaterialCode" NOT NULL,
    "source" "JobSource" NOT NULL DEFAULT 'CONFIGURATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "orderId" TEXT,
    "manufacturingJobId" TEXT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "ContainerType" NOT NULL,
    "status" "ContainerStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartContainerAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartContainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remnant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "materialKey" TEXT NOT NULL,
    "materialCode" "MaterialCode" NOT NULL,
    "materialLabel" TEXT NOT NULL,
    "thicknessIn" DECIMAL(8,3) NOT NULL,
    "edgeBandPattern" "EdgeBandPattern" NOT NULL DEFAULT 'ALL_FOUR',
    "lengthIn" DECIMAL(8,3) NOT NULL,
    "widthIn" DECIMAL(8,3) NOT NULL,
    "areaSqIn" DECIMAL(10,3) NOT NULL,
    "usableAreaSqIn" DECIMAL(10,3),
    "sourceBatchId" TEXT,
    "sourceType" "RemnantSourceType" NOT NULL DEFAULT 'MANUAL',
    "status" "RemnantStatus" NOT NULL DEFAULT 'AVAILABLE',
    "locationLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remnant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemnantUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "remnantId" TEXT NOT NULL,
    "batchId" TEXT,
    "partId" TEXT,
    "actionType" "RemnantUsageActionType" NOT NULL,
    "usedAreaSqIn" DECIMAL(10,3),
    "previousLengthIn" DECIMAL(8,3),
    "previousWidthIn" DECIMAL(8,3),
    "newLengthIn" DECIMAL(8,3),
    "newWidthIn" DECIMAL(8,3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemnantUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBundle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "shipByDate" TIMESTAMP(3) NOT NULL,
    "materialCode" "MaterialCode" NOT NULL,
    "status" "ProductionBundleStatus" NOT NULL DEFAULT 'DRAFT',
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "nestingApprovedAt" TIMESTAMP(3),
    "nestingApprovedBy" TEXT,
    "cncApprovedAt" TIMESTAMP(3),
    "cncApprovedBy" TEXT,
    "currentNestVersion" INTEGER,
    "currentCncVersion" INTEGER,
    "totalLineItems" INTEGER NOT NULL DEFAULT 0,
    "totalPhysicalParts" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "batchId" TEXT,
    "productionBundleId" TEXT,
    "productionBundleCode" TEXT,
    "materialCode" "MaterialCode" NOT NULL,
    "sheetNumber" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "widthIn" DECIMAL(8,3) NOT NULL,
    "heightIn" DECIMAL(8,3) NOT NULL,
    "usableXIn" DECIMAL(8,3) NOT NULL,
    "usableYIn" DECIMAL(8,3) NOT NULL,
    "usableWidthIn" DECIMAL(8,3) NOT NULL,
    "usableHeightIn" DECIMAL(8,3) NOT NULL,
    "utilizationPct" DECIMAL(6,3) NOT NULL,
    "status" "SheetStatus" NOT NULL DEFAULT 'PLANNED',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scrapReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetPlacement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sheetId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "xMm" INTEGER NOT NULL,
    "yMm" INTEGER NOT NULL,
    "xIn" DECIMAL(8,3) NOT NULL,
    "yIn" DECIMAL(8,3) NOT NULL,
    "widthIn" DECIMAL(8,3) NOT NULL,
    "depthIn" DECIMAL(8,3) NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "rotationDeg" INTEGER NOT NULL DEFAULT 0,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 1,
    "onionSkin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheetPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CncJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "batchId" TEXT,
    "productionBundleId" TEXT,
    "productionBundleCode" TEXT,
    "sheetId" TEXT,
    "code" TEXT NOT NULL,
    "materialCode" "MaterialCode" NOT NULL,
    "controllerType" TEXT NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "CncJobStatus" NOT NULL DEFAULT 'GENERATED',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "toolDiameterIn" DECIMAL(8,3) NOT NULL,
    "spindleRpm" INTEGER NOT NULL,
    "feedRateIpm" INTEGER NOT NULL,
    "plungeRateIpm" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "postedAt" TIMESTAMP(3),
    "ranAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "machineCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "stationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "orderId" TEXT NOT NULL,
    "carrierCode" TEXT,
    "trackingNo" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "artifactType" "ArtifactType",
    "uri" TEXT NOT NULL,
    "mimeType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "supersededAt" TIMESTAMP(3),
    "generatedFrom" TEXT,
    "orderId" TEXT,
    "batchId" TEXT,
    "productionBundleId" TEXT,
    "productionBundleCode" TEXT,
    "sheetId" TEXT,
    "cncJobId" TEXT,
    "shipmentId" TEXT,
    "remnantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MachineType" NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "locationLabel" TEXT,
    "adapterType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventTs" TIMESTAMP(3) NOT NULL,
    "sourceType" "MachineEventSourceType" NOT NULL,
    "sourceEventId" TEXT,
    "payloadJson" JSONB NOT NULL,
    "normalizedBatchRef" TEXT,
    "normalizedJobRef" TEXT,
    "normalizedPartRef" TEXT,
    "sheetRef" TEXT,
    "severity" TEXT,
    "processingStatus" "MachineEventProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "linkedBatchId" TEXT,
    "linkedManufacturingJobId" TEXT,
    "linkedPartId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageCandidateSignal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceMachineEventId" TEXT NOT NULL,
    "sourceMachineId" TEXT NOT NULL,
    "targetType" "StageCandidateTargetType" NOT NULL,
    "targetPartId" TEXT,
    "targetBatchId" TEXT,
    "targetManufacturingJobId" TEXT,
    "candidateStage" TEXT NOT NULL,
    "currentStage" TEXT,
    "recommendedAction" "StageCandidateAction" NOT NULL,
    "confidence" "StageCandidateConfidence" NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "StageCandidateStatus" NOT NULL DEFAULT 'OPEN',
    "appliedMode" "StageCandidateAppliedMode",
    "autoAppliedByRuleId" TEXT,
    "autoAppliedAt" TIMESTAMP(3),
    "autoApplyRationale" TEXT,
    "reviewedByMemberId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageCandidateSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedAutoApplyRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "machineId" TEXT,
    "machineType" "MachineType",
    "candidateAction" "StageCandidateAction" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustedAutoApplyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "controllerType" TEXT NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "units" TEXT NOT NULL,
    "toolDiameterIn" DECIMAL(8,3) NOT NULL,
    "spindleRpm" INTEGER NOT NULL,
    "feedRateIpm" INTEGER NOT NULL,
    "plungeRateIpm" INTEGER,
    "cutDepthIn" DECIMAL(8,3) NOT NULL,
    "onionSkinDepthIn" DECIMAL(8,3) NOT NULL,
    "safeZIn" DECIMAL(8,3) NOT NULL,
    "defaultCutStrategy" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" "MaterialCode" NOT NULL,
    "name" TEXT NOT NULL,
    "thicknessIn" DECIMAL(8,3) NOT NULL,
    "sheetWidthIn" DECIMAL(8,3) NOT NULL,
    "sheetDepthIn" DECIMAL(8,3) NOT NULL,
    "trimMarginIn" DECIMAL(8,3) NOT NULL,
    "defaultEdgeBandPattern" "EdgeBandPattern" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_role_idx" ON "OrganizationMember"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationToken_tokenHash_key" ON "ActivationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ActivationToken_userId_expiresAt_idx" ON "ActivationToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalOrderId_key" ON "Order"("externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_amazonOrderId_key" ON "Order"("amazonOrderId");

-- CreateIndex
CREATE INDEX "Order_organizationId_shipByDate_idx" ON "Order"("organizationId", "shipByDate");

-- CreateIndex
CREATE INDEX "Order_customerLastName_idx" ON "Order"("customerLastName");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_externalOrderItemId_key" ON "OrderItem"("externalOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_amazonOrderItemId_key" ON "OrderItem"("amazonOrderItemId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_organizationId_idx" ON "OrderItem"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Part_scanCode_key" ON "Part"("scanCode");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partCode_key" ON "Part"("partCode");

-- CreateIndex
CREATE INDEX "Part_shipByDate_materialCode_idx" ON "Part"("shipByDate", "materialCode");

-- CreateIndex
CREATE INDEX "Part_orderItemId_idx" ON "Part"("orderItemId");

-- CreateIndex
CREATE INDEX "Part_customerLastName_idx" ON "Part"("customerLastName");

-- CreateIndex
CREATE INDEX "Part_organizationId_idx" ON "Part"("organizationId");

-- CreateIndex
CREATE INDEX "Part_currentContainerId_idx" ON "Part"("currentContainerId");

-- CreateIndex
CREATE INDEX "ManufacturingJob_organizationId_status_idx" ON "ManufacturingJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ManufacturingJob_materialCode_channel_idx" ON "ManufacturingJob"("materialCode", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_code_key" ON "Batch"("code");

-- CreateIndex
CREATE INDEX "Container_organizationId_batchId_status_idx" ON "Container"("organizationId", "batchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Container_organizationId_code_key" ON "Container"("organizationId", "code");

-- CreateIndex
CREATE INDEX "PartContainerAssignment_organizationId_assignedAt_idx" ON "PartContainerAssignment"("organizationId", "assignedAt");

-- CreateIndex
CREATE INDEX "PartContainerAssignment_partId_removedAt_idx" ON "PartContainerAssignment"("partId", "removedAt");

-- CreateIndex
CREATE INDEX "PartContainerAssignment_containerId_removedAt_idx" ON "PartContainerAssignment"("containerId", "removedAt");

-- CreateIndex
CREATE INDEX "Remnant_organizationId_materialKey_status_idx" ON "Remnant"("organizationId", "materialKey", "status");

-- CreateIndex
CREATE INDEX "Remnant_organizationId_locationLabel_idx" ON "Remnant"("organizationId", "locationLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Remnant_organizationId_code_key" ON "Remnant"("organizationId", "code");

-- CreateIndex
CREATE INDEX "RemnantUsage_organizationId_createdAt_idx" ON "RemnantUsage"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "RemnantUsage_remnantId_createdAt_idx" ON "RemnantUsage"("remnantId", "createdAt");

-- CreateIndex
CREATE INDEX "RemnantUsage_batchId_createdAt_idx" ON "RemnantUsage"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "RemnantUsage_partId_createdAt_idx" ON "RemnantUsage"("partId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionBundle_code_key" ON "ProductionBundle"("code");

-- CreateIndex
CREATE INDEX "ProductionBundle_organizationId_shipByDate_idx" ON "ProductionBundle"("organizationId", "shipByDate");

-- CreateIndex
CREATE INDEX "ProductionBundle_status_materialCode_idx" ON "ProductionBundle"("status", "materialCode");

-- CreateIndex
CREATE INDEX "Sheet_productionBundleId_version_idx" ON "Sheet"("productionBundleId", "version");

-- CreateIndex
CREATE INDEX "Sheet_productionBundleCode_materialCode_idx" ON "Sheet"("productionBundleCode", "materialCode");

-- CreateIndex
CREATE INDEX "Sheet_organizationId_idx" ON "Sheet"("organizationId");

-- CreateIndex
CREATE INDEX "SheetPlacement_organizationId_idx" ON "SheetPlacement"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CncJob_code_key" ON "CncJob"("code");

-- CreateIndex
CREATE INDEX "CncJob_productionBundleId_version_idx" ON "CncJob"("productionBundleId", "version");

-- CreateIndex
CREATE INDEX "CncJob_productionBundleCode_materialCode_idx" ON "CncJob"("productionBundleCode", "materialCode");

-- CreateIndex
CREATE INDEX "CncJob_organizationId_idx" ON "CncJob"("organizationId");

-- CreateIndex
CREATE INDEX "ScanEvent_organizationId_idx" ON "ScanEvent"("organizationId");

-- CreateIndex
CREATE INDEX "Shipment_organizationId_idx" ON "Shipment"("organizationId");

-- CreateIndex
CREATE INDEX "Artifact_organizationId_idx" ON "Artifact"("organizationId");

-- CreateIndex
CREATE INDEX "Machine_organizationId_type_status_idx" ON "Machine"("organizationId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_organizationId_code_key" ON "Machine"("organizationId", "code");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_machineId_createdAt_idx" ON "MachineEvent"("organizationId", "machineId", "createdAt");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_processingStatus_createdAt_idx" ON "MachineEvent"("organizationId", "processingStatus", "createdAt");

-- CreateIndex
CREATE INDEX "MachineEvent_organizationId_eventType_createdAt_idx" ON "MachineEvent"("organizationId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "MachineEvent_linkedBatchId_idx" ON "MachineEvent"("linkedBatchId");

-- CreateIndex
CREATE INDEX "MachineEvent_linkedManufacturingJobId_idx" ON "MachineEvent"("linkedManufacturingJobId");

-- CreateIndex
CREATE INDEX "MachineEvent_linkedPartId_idx" ON "MachineEvent"("linkedPartId");

-- CreateIndex
CREATE INDEX "StageCandidateSignal_organizationId_status_createdAt_idx" ON "StageCandidateSignal"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "StageCandidateSignal_sourceMachineEventId_idx" ON "StageCandidateSignal"("sourceMachineEventId");

-- CreateIndex
CREATE INDEX "StageCandidateSignal_sourceMachineId_idx" ON "StageCandidateSignal"("sourceMachineId");

-- CreateIndex
CREATE INDEX "StageCandidateSignal_targetBatchId_idx" ON "StageCandidateSignal"("targetBatchId");

-- CreateIndex
CREATE INDEX "StageCandidateSignal_targetManufacturingJobId_idx" ON "StageCandidateSignal"("targetManufacturingJobId");

-- CreateIndex
CREATE INDEX "StageCandidateSignal_targetPartId_idx" ON "StageCandidateSignal"("targetPartId");

-- CreateIndex
CREATE UNIQUE INDEX "StageCandidateSignal_sourceMachineEventId_recommendedAction_key" ON "StageCandidateSignal"("sourceMachineEventId", "recommendedAction", "targetType", "targetBatchId", "targetManufacturingJobId", "targetPartId");

-- CreateIndex
CREATE INDEX "TrustedAutoApplyRule_organizationId_enabled_candidateAction_idx" ON "TrustedAutoApplyRule"("organizationId", "enabled", "candidateAction");

-- CreateIndex
CREATE INDEX "TrustedAutoApplyRule_machineId_candidateAction_enabled_idx" ON "TrustedAutoApplyRule"("machineId", "candidateAction", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "MachineProfile_code_key" ON "MachineProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialProfile_organizationId_code_key" ON "MaterialProfile"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationToken" ADD CONSTRAINT "ActivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_currentContainerId_fkey" FOREIGN KEY ("currentContainerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_manufacturingJobId_fkey" FOREIGN KEY ("manufacturingJobId") REFERENCES "ManufacturingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_manufacturingJobId_fkey" FOREIGN KEY ("manufacturingJobId") REFERENCES "ManufacturingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartContainerAssignment" ADD CONSTRAINT "PartContainerAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartContainerAssignment" ADD CONSTRAINT "PartContainerAssignment_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartContainerAssignment" ADD CONSTRAINT "PartContainerAssignment_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remnant" ADD CONSTRAINT "Remnant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remnant" ADD CONSTRAINT "Remnant_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantUsage" ADD CONSTRAINT "RemnantUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantUsage" ADD CONSTRAINT "RemnantUsage_remnantId_fkey" FOREIGN KEY ("remnantId") REFERENCES "Remnant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantUsage" ADD CONSTRAINT "RemnantUsage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemnantUsage" ADD CONSTRAINT "RemnantUsage_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBundle" ADD CONSTRAINT "ProductionBundle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_productionBundleId_fkey" FOREIGN KEY ("productionBundleId") REFERENCES "ProductionBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetPlacement" ADD CONSTRAINT "SheetPlacement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetPlacement" ADD CONSTRAINT "SheetPlacement_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetPlacement" ADD CONSTRAINT "SheetPlacement_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CncJob" ADD CONSTRAINT "CncJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CncJob" ADD CONSTRAINT "CncJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CncJob" ADD CONSTRAINT "CncJob_productionBundleId_fkey" FOREIGN KEY ("productionBundleId") REFERENCES "ProductionBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CncJob" ADD CONSTRAINT "CncJob_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_productionBundleId_fkey" FOREIGN KEY ("productionBundleId") REFERENCES "ProductionBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_cncJobId_fkey" FOREIGN KEY ("cncJobId") REFERENCES "CncJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_remnantId_fkey" FOREIGN KEY ("remnantId") REFERENCES "Remnant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_linkedBatchId_fkey" FOREIGN KEY ("linkedBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_linkedManufacturingJobId_fkey" FOREIGN KEY ("linkedManufacturingJobId") REFERENCES "ManufacturingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineEvent" ADD CONSTRAINT "MachineEvent_linkedPartId_fkey" FOREIGN KEY ("linkedPartId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_sourceMachineEventId_fkey" FOREIGN KEY ("sourceMachineEventId") REFERENCES "MachineEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_sourceMachineId_fkey" FOREIGN KEY ("sourceMachineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_targetPartId_fkey" FOREIGN KEY ("targetPartId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_targetBatchId_fkey" FOREIGN KEY ("targetBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_targetManufacturingJobId_fkey" FOREIGN KEY ("targetManufacturingJobId") REFERENCES "ManufacturingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_reviewedByMemberId_fkey" FOREIGN KEY ("reviewedByMemberId") REFERENCES "OrganizationMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageCandidateSignal" ADD CONSTRAINT "StageCandidateSignal_autoAppliedByRuleId_fkey" FOREIGN KEY ("autoAppliedByRuleId") REFERENCES "TrustedAutoApplyRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedAutoApplyRule" ADD CONSTRAINT "TrustedAutoApplyRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedAutoApplyRule" ADD CONSTRAINT "TrustedAutoApplyRule_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineProfile" ADD CONSTRAINT "MachineProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialProfile" ADD CONSTRAINT "MaterialProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


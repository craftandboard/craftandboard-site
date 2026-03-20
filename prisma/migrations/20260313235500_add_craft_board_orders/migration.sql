CREATE TYPE "CraftBoardOrderStatus" AS ENUM (
  'RELEASED',
  'PREP_IN_PROGRESS',
  'READY_FOR_PRODUCTION',
  'IN_PRODUCTION',
  'READY_TO_FULFILL',
  'FULFILLED',
  'CLOSED',
  'CANCELLED'
);

CREATE TABLE "CraftBoardOrder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "depositRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "CraftBoardOrderStatus" NOT NULL DEFAULT 'RELEASED',
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "releasedBy" TEXT,
    "customerNameSnapshot" TEXT NOT NULL,
    "customerEmailSnapshot" TEXT NOT NULL,
    "customerPhoneSnapshot" TEXT,
    "productFamily" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "reviewedWidthValue" DECIMAL(65,30),
    "reviewedWidthUnit" TEXT NOT NULL,
    "reviewedDepthValue" DECIMAL(65,30),
    "reviewedDepthUnit" TEXT NOT NULL,
    "reviewedThicknessValue" DECIMAL(65,30),
    "reviewedThicknessUnit" TEXT NOT NULL,
    "reviewedQuantity" INTEGER NOT NULL,
    "reviewedMaterialCode" TEXT,
    "reviewedMaterialLabel" TEXT,
    "reviewedMountingCode" TEXT,
    "reviewedMountingLabel" TEXT,
    "proposalSubtotalAmountCents" INTEGER NOT NULL,
    "proposalDiscountAmountCents" INTEGER NOT NULL,
    "proposalShippingAmountCents" INTEGER NOT NULL,
    "proposalTotalAmountCents" INTEGER NOT NULL,
    "depositAmountPaidCents" INTEGER NOT NULL,
    "remainingBalanceAmountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeText" TEXT,
    "scopeSummary" TEXT,
    "customerNotesSnapshot" TEXT,
    "internalReleaseNotes" TEXT,
    "productionPrepNotes" TEXT,
    "fulfillmentNotes" TEXT,
    "requestedShipDate" TIMESTAMP(3),
    "targetCompletionDate" TIMESTAMP(3),
    "readyForProductionAt" TIMESTAMP(3),
    "productionReleasedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "orderSummaryJson" JSONB,
    "commercialSnapshotJson" JSONB,
    "configurationSnapshotJson" JSONB,

    CONSTRAINT "CraftBoardOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CraftBoardOrder_orderNumber_key" ON "CraftBoardOrder"("orderNumber");
CREATE UNIQUE INDEX "CraftBoardOrder_proposalId_key" ON "CraftBoardOrder"("proposalId");
CREATE UNIQUE INDEX "CraftBoardOrder_depositRequestId_key" ON "CraftBoardOrder"("depositRequestId");
CREATE INDEX "CraftBoardOrder_organizationId_createdAt_idx" ON "CraftBoardOrder"("organizationId", "createdAt");
CREATE INDEX "CraftBoardOrder_organizationId_status_idx" ON "CraftBoardOrder"("organizationId", "status");
CREATE INDEX "CraftBoardOrder_orderNumber_idx" ON "CraftBoardOrder"("orderNumber");
CREATE INDEX "CraftBoardOrder_inquiryId_idx" ON "CraftBoardOrder"("inquiryId");
CREATE INDEX "CraftBoardOrder_proposalId_idx" ON "CraftBoardOrder"("proposalId");
CREATE INDEX "CraftBoardOrder_depositRequestId_idx" ON "CraftBoardOrder"("depositRequestId");

ALTER TABLE "CraftBoardOrder"
ADD CONSTRAINT "CraftBoardOrder_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardOrder"
ADD CONSTRAINT "CraftBoardOrder_inquiryId_fkey"
FOREIGN KEY ("inquiryId") REFERENCES "CraftBoardInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardOrder"
ADD CONSTRAINT "CraftBoardOrder_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "CraftBoardProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardOrder"
ADD CONSTRAINT "CraftBoardOrder_depositRequestId_fkey"
FOREIGN KEY ("depositRequestId") REFERENCES "CraftBoardDepositRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

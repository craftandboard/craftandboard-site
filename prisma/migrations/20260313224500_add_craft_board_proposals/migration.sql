CREATE TYPE "CraftBoardProposalStatus" AS ENUM (
  'DRAFT',
  'READY',
  'SHARED',
  'VIEWED',
  'APPROVED',
  'DECLINED',
  'EXPIRED',
  'ARCHIVED'
);

CREATE TABLE "CraftBoardProposal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CraftBoardProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "proposalNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerNameSnapshot" TEXT NOT NULL,
    "customerEmailSnapshot" TEXT NOT NULL,
    "customerPhoneSnapshot" TEXT,
    "productFamily" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "reviewedWidthValue" DECIMAL(65,30),
    "reviewedDepthValue" DECIMAL(65,30),
    "reviewedThicknessValue" DECIMAL(65,30),
    "reviewedQuantity" INTEGER NOT NULL,
    "reviewedMaterialCode" TEXT,
    "reviewedMaterialLabel" TEXT,
    "reviewedMountingCode" TEXT,
    "reviewedMountingLabel" TEXT,
    "subtotalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "discountAmountCents" INTEGER NOT NULL DEFAULT 0,
    "shippingAmountCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeText" TEXT,
    "scopeSummary" TEXT NOT NULL,
    "inclusionsText" TEXT,
    "exclusionsText" TEXT,
    "notesForCustomer" TEXT,
    "internalNotes" TEXT,
    "publicToken" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3),
    "customerViewedAt" TIMESTAMP(3),
    "customerApprovedAt" TIMESTAMP(3),
    "customerDeclinedAt" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "preparedBy" TEXT,
    "referenceCode" TEXT,

    CONSTRAINT "CraftBoardProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CraftBoardProposalLineItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitLabel" TEXT,
    "unitAmountCents" INTEGER NOT NULL DEFAULT 0,
    "lineTotalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "itemType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CraftBoardProposalLineItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CraftBoardProposal_proposalNumber_key" ON "CraftBoardProposal"("proposalNumber");
CREATE UNIQUE INDEX "CraftBoardProposal_publicToken_key" ON "CraftBoardProposal"("publicToken");
CREATE UNIQUE INDEX "CraftBoardProposal_inquiryId_key" ON "CraftBoardProposal"("inquiryId");
CREATE INDEX "CraftBoardProposal_organizationId_createdAt_idx" ON "CraftBoardProposal"("organizationId", "createdAt");
CREATE INDEX "CraftBoardProposal_organizationId_status_idx" ON "CraftBoardProposal"("organizationId", "status");
CREATE INDEX "CraftBoardProposal_organizationId_proposalNumber_idx" ON "CraftBoardProposal"("organizationId", "proposalNumber");
CREATE INDEX "CraftBoardProposal_publicToken_idx" ON "CraftBoardProposal"("publicToken");
CREATE INDEX "CraftBoardProposalLineItem_organizationId_proposalId_idx" ON "CraftBoardProposalLineItem"("organizationId", "proposalId");
CREATE INDEX "CraftBoardProposalLineItem_proposalId_sortOrder_idx" ON "CraftBoardProposalLineItem"("proposalId", "sortOrder");

ALTER TABLE "CraftBoardProposal"
ADD CONSTRAINT "CraftBoardProposal_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProposal"
ADD CONSTRAINT "CraftBoardProposal_inquiryId_fkey"
FOREIGN KEY ("inquiryId") REFERENCES "CraftBoardInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProposalLineItem"
ADD CONSTRAINT "CraftBoardProposalLineItem_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardProposalLineItem"
ADD CONSTRAINT "CraftBoardProposalLineItem_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "CraftBoardProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

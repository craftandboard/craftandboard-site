ALTER TYPE "CraftBoardInquiryStatus" ADD VALUE 'QUOTE_IN_PROGRESS';
ALTER TYPE "CraftBoardInquiryStatus" ADD VALUE 'LOST';

ALTER TABLE "CraftBoardInquiry"
ADD COLUMN "assignedToUserId" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "quotedAt" TIMESTAMP(3),
ADD COLUMN "followUpNotes" TEXT,
ADD COLUMN "reviewedWidthValue" DECIMAL(65,30),
ADD COLUMN "reviewedDepthValue" DECIMAL(65,30),
ADD COLUMN "reviewedThicknessValue" DECIMAL(65,30),
ADD COLUMN "reviewedQuantity" INTEGER,
ADD COLUMN "reviewedMaterialCode" TEXT,
ADD COLUMN "reviewedMaterialLabel" TEXT,
ADD COLUMN "reviewedMountingCode" TEXT,
ADD COLUMN "reviewedMountingLabel" TEXT,
ADD COLUMN "estimateBaseAmountCents" INTEGER,
ADD COLUMN "estimateLowAmountCents" INTEGER,
ADD COLUMN "estimateHighAmountCents" INTEGER,
ADD COLUMN "estimateCurrencyCode" TEXT,
ADD COLUMN "estimateLeadTimeText" TEXT,
ADD COLUMN "estimateSummaryJson" JSONB,
ADD COLUMN "quotePreparedBy" TEXT,
ADD COLUMN "quoteReferenceCode" TEXT;

CREATE INDEX "CraftBoardInquiry_organizationId_reviewedAt_idx" ON "CraftBoardInquiry"("organizationId", "reviewedAt");
CREATE INDEX "CraftBoardInquiry_organizationId_quotedAt_idx" ON "CraftBoardInquiry"("organizationId", "quotedAt");
CREATE INDEX "CraftBoardInquiry_assignedToUserId_idx" ON "CraftBoardInquiry"("assignedToUserId");

ALTER TABLE "CraftBoardInquiry"
ADD CONSTRAINT "CraftBoardInquiry_assignedToUserId_fkey"
FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

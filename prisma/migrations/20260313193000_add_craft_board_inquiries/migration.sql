CREATE TYPE "CraftBoardInquiryStatus" AS ENUM ('NEW', 'REVIEWED', 'QUOTED', 'CLOSED');

CREATE TABLE "CraftBoardInquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CraftBoardInquiryStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL,
    "sourcePath" TEXT,
    "productFamily" TEXT NOT NULL,
    "productSlug" TEXT,
    "productName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "widthValue" DECIMAL(65,30),
    "widthUnit" TEXT,
    "depthValue" DECIMAL(65,30),
    "depthUnit" TEXT,
    "thicknessValue" DECIMAL(65,30),
    "thicknessUnit" TEXT,
    "quantity" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialLabel" TEXT,
    "mountingCode" TEXT,
    "mountingLabel" TEXT,
    "notes" TEXT,
    "configurationJson" JSONB NOT NULL,
    "internalNotes" TEXT,

    CONSTRAINT "CraftBoardInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CraftBoardInquiry_organizationId_createdAt_idx" ON "CraftBoardInquiry"("organizationId", "createdAt");
CREATE INDEX "CraftBoardInquiry_organizationId_status_idx" ON "CraftBoardInquiry"("organizationId", "status");
CREATE INDEX "CraftBoardInquiry_organizationId_productFamily_idx" ON "CraftBoardInquiry"("organizationId", "productFamily");
CREATE INDEX "CraftBoardInquiry_organizationId_customerEmail_idx" ON "CraftBoardInquiry"("organizationId", "customerEmail");
CREATE INDEX "CraftBoardInquiry_leadId_idx" ON "CraftBoardInquiry"("leadId");

ALTER TABLE "CraftBoardInquiry" ADD CONSTRAINT "CraftBoardInquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CraftBoardInquiry" ADD CONSTRAINT "CraftBoardInquiry_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

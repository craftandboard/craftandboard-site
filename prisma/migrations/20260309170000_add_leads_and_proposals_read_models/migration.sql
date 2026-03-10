CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT,
    "stage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "leadId" TEXT,
    "title" TEXT,
    "status" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publicToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalSection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sectionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "qty" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_organizationId_createdAt_idx" ON "Lead"("organizationId", "createdAt");
CREATE INDEX "Lead_organizationId_status_idx" ON "Lead"("organizationId", "status");
CREATE INDEX "Lead_organizationId_stage_idx" ON "Lead"("organizationId", "stage");

CREATE UNIQUE INDEX "Proposal_publicToken_key" ON "Proposal"("publicToken");
CREATE INDEX "Proposal_organizationId_projectId_idx" ON "Proposal"("organizationId", "projectId");
CREATE INDEX "Proposal_organizationId_leadId_idx" ON "Proposal"("organizationId", "leadId");
CREATE INDEX "Proposal_organizationId_status_idx" ON "Proposal"("organizationId", "status");

CREATE INDEX "ProposalSection_organizationId_proposalId_idx" ON "ProposalSection"("organizationId", "proposalId");
CREATE INDEX "ProposalSection_proposalId_sortOrder_idx" ON "ProposalSection"("proposalId", "sortOrder");

CREATE INDEX "ProposalLine_organizationId_proposalId_idx" ON "ProposalLine"("organizationId", "proposalId");
CREATE INDEX "ProposalLine_proposalId_sortOrder_idx" ON "ProposalLine"("proposalId", "sortOrder");
CREATE INDEX "ProposalLine_sectionId_idx" ON "ProposalLine"("sectionId");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProposalSection" ADD CONSTRAINT "ProposalSection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalSection" ADD CONSTRAINT "ProposalSection_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalLine" ADD CONSTRAINT "ProposalLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalLine" ADD CONSTRAINT "ProposalLine_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProposalLine" ADD CONSTRAINT "ProposalLine_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ProposalSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

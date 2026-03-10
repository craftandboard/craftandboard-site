CREATE TYPE "ProposalDepositPolicy" AS ENUM ('NO_DEPOSIT_REQUIRED', 'DEPOSIT_REQUIRED_BEFORE_CONVERSION');
CREATE TYPE "ProposalAcceptanceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');
CREATE TYPE "ProposalAcceptanceDecisionSource" AS ENUM ('MANUAL_INTERNAL', 'MANUAL_EXTERNAL', 'PROVIDER_CONFIRMED');
CREATE TYPE "ProposalConversionStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'BLOCKED', 'CONVERTED', 'FAILED', 'CANCELED');
CREATE TYPE "ProposalOrchestrationAction" AS ENUM ('ACCEPTANCE_CREATED', 'ACCEPTANCE_ACCEPTED', 'ACCEPTANCE_REJECTED', 'ACCEPTANCE_CANCELED', 'ELIGIBILITY_CHECKED', 'CONVERSION_MARKED_ELIGIBLE', 'CONVERSION_BLOCKED', 'PROJECT_CREATED', 'LEAD_STATUS_SYNCED', 'PROPOSAL_STATUS_SYNCED', 'REQUEST_IGNORED_DUPLICATE', 'ORCHESTRATION_FAILED');
CREATE TYPE "ProposalOrchestrationOutcome" AS ENUM ('APPLIED', 'SKIPPED', 'FAILED');

ALTER TABLE "Proposal" ADD COLUMN "depositPolicy" "ProposalDepositPolicy" NOT NULL DEFAULT 'NO_DEPOSIT_REQUIRED';

CREATE TABLE "ProposalAcceptance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "status" "ProposalAcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "acceptedByMembershipId" TEXT,
    "rejectedByMembershipId" TEXT,
    "canceledByMembershipId" TEXT,
    "decisionSource" "ProposalAcceptanceDecisionSource" NOT NULL DEFAULT 'MANUAL_INTERNAL',
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalConversion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "leadId" TEXT,
    "acceptanceId" TEXT,
    "status" "ProposalConversionStatus" NOT NULL DEFAULT 'PENDING',
    "eligibilitySnapshot" JSONB,
    "blockedReasonCode" TEXT,
    "blockedReasonMessage" TEXT,
    "convertedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "initiatedByMembershipId" TEXT,
    "completedByMembershipId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalConversion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProposalConversion_acceptanceId_key" ON "ProposalConversion"("acceptanceId");

CREATE TABLE "ProposalOrchestrationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "acceptanceId" TEXT,
    "conversionId" TEXT,
    "action" "ProposalOrchestrationAction" NOT NULL,
    "outcome" "ProposalOrchestrationOutcome" NOT NULL,
    "message" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalOrchestrationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProposalAcceptance_proposalId_key" ON "ProposalAcceptance"("proposalId");
CREATE INDEX "ProposalAcceptance_organizationId_proposalId_idx" ON "ProposalAcceptance"("organizationId", "proposalId");

CREATE UNIQUE INDEX "ProposalConversion_proposalId_key" ON "ProposalConversion"("proposalId");
CREATE INDEX "ProposalConversion_organizationId_proposalId_status_idx" ON "ProposalConversion"("organizationId", "proposalId", "status");
CREATE INDEX "ProposalConversion_organizationId_projectId_idx" ON "ProposalConversion"("organizationId", "projectId");

CREATE INDEX "ProposalOrchestrationLog_organizationId_proposalId_idx" ON "ProposalOrchestrationLog"("organizationId", "proposalId");
CREATE INDEX "ProposalOrchestrationLog_organizationId_acceptanceId_idx" ON "ProposalOrchestrationLog"("organizationId", "acceptanceId");
CREATE INDEX "ProposalOrchestrationLog_organizationId_conversionId_idx" ON "ProposalOrchestrationLog"("organizationId", "conversionId");

ALTER TABLE "ProposalAcceptance" ADD CONSTRAINT "ProposalAcceptance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalAcceptance" ADD CONSTRAINT "ProposalAcceptance_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalConversion" ADD CONSTRAINT "ProposalConversion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalConversion" ADD CONSTRAINT "ProposalConversion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProposalConversion" ADD CONSTRAINT "ProposalConversion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProposalConversion" ADD CONSTRAINT "ProposalConversion_acceptanceId_fkey" FOREIGN KEY ("acceptanceId") REFERENCES "ProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProposalConversion" ADD CONSTRAINT "ProposalConversion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProposalOrchestrationLog" ADD CONSTRAINT "ProposalOrchestrationLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalOrchestrationLog" ADD CONSTRAINT "ProposalOrchestrationLog_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProposalOrchestrationLog" ADD CONSTRAINT "ProposalOrchestrationLog_acceptanceId_fkey" FOREIGN KEY ("acceptanceId") REFERENCES "ProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProposalOrchestrationLog" ADD CONSTRAINT "ProposalOrchestrationLog_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "ProposalConversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

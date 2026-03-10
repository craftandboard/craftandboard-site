CREATE TYPE "ProposalAcceptancePresentationAction" AS ENUM (
  'PRESENTATION_VIEWED',
  'INSTRUCTIONS_RETURNED',
  'READY_STATE_RETURNED',
  'SUBMISSION_STATE_RETURNED',
  'CONFIRMATION_RETURNED',
  'PRESENTATION_BLOCKED',
  'REQUEST_IGNORED_DUPLICATE'
);

CREATE TYPE "ProposalAcceptancePresentationOutcome" AS ENUM (
  'APPLIED',
  'SKIPPED',
  'FAILED'
);

CREATE TABLE "ProposalAcceptancePresentationLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "action" "ProposalAcceptancePresentationAction" NOT NULL,
  "outcome" "ProposalAcceptancePresentationOutcome" NOT NULL,
  "message" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProposalAcceptancePresentationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProposalAcceptancePresentationLog_organizationId_proposalId_idx" ON "ProposalAcceptancePresentationLog"("organizationId", "proposalId");
CREATE INDEX "ProposalAcceptancePresentationLog_organizationId_intakeId_idx" ON "ProposalAcceptancePresentationLog"("organizationId", "intakeId");

ALTER TABLE "ProposalAcceptancePresentationLog"
  ADD CONSTRAINT "ProposalAcceptancePresentationLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptancePresentationLog"
  ADD CONSTRAINT "ProposalAcceptancePresentationLog_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptancePresentationLog"
  ADD CONSTRAINT "ProposalAcceptancePresentationLog_intakeId_fkey"
  FOREIGN KEY ("intakeId") REFERENCES "ProposalAcceptanceIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

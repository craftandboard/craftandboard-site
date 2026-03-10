CREATE TYPE "ProposalAcceptanceReviewAction" AS ENUM (
  'SNAPSHOT_GENERATED',
  'SNAPSHOT_VIEWED',
  'TOKEN_VALIDATED_FOR_REVIEW',
  'REVIEW_BLOCKED',
  'REVIEW_CONTEXT_RETURNED',
  'REQUEST_IGNORED_DUPLICATE'
);

CREATE TYPE "ProposalAcceptanceReviewOutcome" AS ENUM (
  'APPLIED',
  'SKIPPED',
  'FAILED'
);

CREATE TABLE "ProposalAcceptanceReviewLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "action" "ProposalAcceptanceReviewAction" NOT NULL,
  "outcome" "ProposalAcceptanceReviewOutcome" NOT NULL,
  "message" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProposalAcceptanceReviewLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProposalAcceptanceReviewLog_organizationId_proposalId_idx" ON "ProposalAcceptanceReviewLog"("organizationId", "proposalId");
CREATE INDEX "ProposalAcceptanceReviewLog_organizationId_intakeId_idx" ON "ProposalAcceptanceReviewLog"("organizationId", "intakeId");

ALTER TABLE "ProposalAcceptanceReviewLog"
  ADD CONSTRAINT "ProposalAcceptanceReviewLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceReviewLog"
  ADD CONSTRAINT "ProposalAcceptanceReviewLog_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceReviewLog"
  ADD CONSTRAINT "ProposalAcceptanceReviewLog_intakeId_fkey"
  FOREIGN KEY ("intakeId") REFERENCES "ProposalAcceptanceIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

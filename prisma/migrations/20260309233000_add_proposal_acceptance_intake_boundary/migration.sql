CREATE TYPE "ProposalAcceptanceIntakeStatus" AS ENUM (
  'OPEN',
  'SUBMITTED',
  'VERIFIED',
  'HANDOFF_ACCEPTED',
  'HANDOFF_REJECTED',
  'EXPIRED',
  'REVOKED',
  'FAILED'
);

CREATE TYPE "ProposalAcceptanceIntakeSource" AS ENUM (
  'PUBLIC_TOKEN',
  'PROVIDER_CALLBACK',
  'EXTERNAL_MANUAL_ENTRY'
);

CREATE TYPE "ProposalAcceptanceEvidenceKind" AS ENUM (
  'CHECKBOX_CONFIRMATION',
  'TYPED_NAME',
  'EMAIL_MATCH',
  'PROVIDER_ASSERTION',
  'IP_CAPTURE',
  'USER_AGENT_CAPTURE',
  'NOTE'
);

CREATE TYPE "ProposalAcceptanceIntakeAction" AS ENUM (
  'INTAKE_CREATED',
  'TOKEN_ISSUED',
  'TOKEN_VALIDATED',
  'TOKEN_REJECTED',
  'SUBMISSION_RECEIVED',
  'SUBMISSION_VERIFIED',
  'SUBMISSION_FAILED',
  'HANDOFF_REQUESTED',
  'HANDOFF_ACCEPTED',
  'HANDOFF_REJECTED',
  'INTAKE_EXPIRED',
  'INTAKE_REVOKED',
  'REQUEST_IGNORED_DUPLICATE'
);

CREATE TYPE "ProposalAcceptanceIntakeOutcome" AS ENUM (
  'APPLIED',
  'SKIPPED',
  'FAILED'
);

CREATE TABLE "ProposalAcceptanceIntake" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "status" "ProposalAcceptanceIntakeStatus" NOT NULL DEFAULT 'OPEN',
  "source" "ProposalAcceptanceIntakeSource" NOT NULL,
  "tokenHash" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "handedOffAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "externalIdentityName" TEXT,
  "externalIdentityEmail" TEXT,
  "externalIp" TEXT,
  "externalUserAgent" TEXT,
  "provider" "PaymentProvider",
  "providerReference" TEXT,
  "note" TEXT,
  "payload" JSONB,
  "verificationSnapshot" JSONB,
  "metadata" JSONB,
  "createdByMembershipId" TEXT,
  "updatedByMembershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProposalAcceptanceIntake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalAcceptanceEvidence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "kind" "ProposalAcceptanceEvidenceKind" NOT NULL,
  "value" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProposalAcceptanceEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalAcceptanceIntakeLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "intakeId" TEXT,
  "action" "ProposalAcceptanceIntakeAction" NOT NULL,
  "outcome" "ProposalAcceptanceIntakeOutcome" NOT NULL,
  "message" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProposalAcceptanceIntakeLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProposalAcceptanceIntake_tokenHash_key" ON "ProposalAcceptanceIntake"("tokenHash");
CREATE INDEX "ProposalAcceptanceIntake_organizationId_proposalId_idx" ON "ProposalAcceptanceIntake"("organizationId", "proposalId");
CREATE INDEX "ProposalAcceptanceIntake_organizationId_proposalId_status_idx" ON "ProposalAcceptanceIntake"("organizationId", "proposalId", "status");
CREATE INDEX "ProposalAcceptanceIntake_organizationId_provider_providerReference_idx" ON "ProposalAcceptanceIntake"("organizationId", "provider", "providerReference");
CREATE INDEX "ProposalAcceptanceEvidence_organizationId_intakeId_idx" ON "ProposalAcceptanceEvidence"("organizationId", "intakeId");
CREATE INDEX "ProposalAcceptanceIntakeLog_organizationId_intakeId_idx" ON "ProposalAcceptanceIntakeLog"("organizationId", "intakeId");
CREATE INDEX "ProposalAcceptanceIntakeLog_organizationId_proposalId_idx" ON "ProposalAcceptanceIntakeLog"("organizationId", "proposalId");

ALTER TABLE "ProposalAcceptanceIntake"
  ADD CONSTRAINT "ProposalAcceptanceIntake_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceIntake"
  ADD CONSTRAINT "ProposalAcceptanceIntake_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceEvidence"
  ADD CONSTRAINT "ProposalAcceptanceEvidence_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceEvidence"
  ADD CONSTRAINT "ProposalAcceptanceEvidence_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceEvidence"
  ADD CONSTRAINT "ProposalAcceptanceEvidence_intakeId_fkey"
  FOREIGN KEY ("intakeId") REFERENCES "ProposalAcceptanceIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceIntakeLog"
  ADD CONSTRAINT "ProposalAcceptanceIntakeLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceIntakeLog"
  ADD CONSTRAINT "ProposalAcceptanceIntakeLog_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalAcceptanceIntakeLog"
  ADD CONSTRAINT "ProposalAcceptanceIntakeLog_intakeId_fkey"
  FOREIGN KEY ("intakeId") REFERENCES "ProposalAcceptanceIntake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

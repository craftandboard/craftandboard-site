CREATE TYPE "DepositRequestKind" AS ENUM ('DEPOSIT');
CREATE TYPE "DepositRequestStatus" AS ENUM ('DRAFT', 'REQUESTED', 'PARTIALLY_PAID', 'PAID', 'VOID');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL', 'EXTERNAL_PROVIDER');
CREATE TYPE "PaymentDirection" AS ENUM ('INBOUND');

CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "kind" "DepositRequestKind" NOT NULL DEFAULT 'DEPOSIT',
    "status" "DepositRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "requestedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "metadata" JSONB,
    "createdByMembershipId" TEXT,
    "updatedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "depositRequestId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL DEFAULT 'MANUAL',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "direction" "PaymentDirection" NOT NULL DEFAULT 'INBOUND',
    "receivedAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "provider" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdByMembershipId" TEXT,
    "updatedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DepositRequest_organizationId_proposalId_idx" ON "DepositRequest"("organizationId", "proposalId");
CREATE INDEX "DepositRequest_organizationId_status_idx" ON "DepositRequest"("organizationId", "status");
CREATE INDEX "DepositRequest_organizationId_externalReference_idx" ON "DepositRequest"("organizationId", "externalReference");

CREATE INDEX "Payment_organizationId_proposalId_idx" ON "Payment"("organizationId", "proposalId");
CREATE INDEX "Payment_organizationId_status_idx" ON "Payment"("organizationId", "status");
CREATE INDEX "Payment_organizationId_externalReference_idx" ON "Payment"("organizationId", "externalReference");
CREATE INDEX "Payment_depositRequestId_idx" ON "Payment"("depositRequestId");

ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_depositRequestId_fkey" FOREIGN KEY ("depositRequestId") REFERENCES "DepositRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

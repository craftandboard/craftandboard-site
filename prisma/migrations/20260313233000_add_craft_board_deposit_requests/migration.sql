CREATE TYPE "CraftBoardDepositRequestStatus" AS ENUM (
  'DRAFT',
  'READY',
  'SHARED',
  'VIEWED',
  'PAYMENT_INITIATED',
  'PAID',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE "CraftBoardDepositType" AS ENUM (
  'FIXED_AMOUNT',
  'PERCENTAGE'
);

CREATE TABLE "CraftBoardDepositRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CraftBoardDepositRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "depositNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerNameSnapshot" TEXT NOT NULL,
    "customerEmailSnapshot" TEXT NOT NULL,
    "customerPhoneSnapshot" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "proposalTotalAmountCents" INTEGER NOT NULL,
    "depositType" "CraftBoardDepositType" NOT NULL,
    "depositPercentBasisPoints" INTEGER,
    "depositAmountCents" INTEGER NOT NULL,
    "remainingBalanceAmountCents" INTEGER,
    "descriptionText" TEXT,
    "customerInstructionsText" TEXT,
    "dueDate" TIMESTAMP(3),
    "sharedAt" TIMESTAMP(3),
    "customerViewedAt" TIMESTAMP(3),
    "paymentInitiatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "paymentProvider" TEXT,
    "paymentProviderReference" TEXT,
    "paymentIntentId" TEXT,
    "checkoutSessionId" TEXT,
    "paymentReceiptReference" TEXT,
    "internalNotes" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "CraftBoardDepositRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CraftBoardDepositRequest_depositNumber_key" ON "CraftBoardDepositRequest"("depositNumber");
CREATE UNIQUE INDEX "CraftBoardDepositRequest_publicToken_key" ON "CraftBoardDepositRequest"("publicToken");
CREATE INDEX "CraftBoardDepositRequest_organizationId_createdAt_idx" ON "CraftBoardDepositRequest"("organizationId", "createdAt");
CREATE INDEX "CraftBoardDepositRequest_organizationId_status_idx" ON "CraftBoardDepositRequest"("organizationId", "status");
CREATE INDEX "CraftBoardDepositRequest_organizationId_depositNumber_idx" ON "CraftBoardDepositRequest"("organizationId", "depositNumber");
CREATE INDEX "CraftBoardDepositRequest_proposalId_idx" ON "CraftBoardDepositRequest"("proposalId");
CREATE INDEX "CraftBoardDepositRequest_publicToken_idx" ON "CraftBoardDepositRequest"("publicToken");
CREATE INDEX "CraftBoardDepositRequest_paymentIntentId_idx" ON "CraftBoardDepositRequest"("paymentIntentId");
CREATE INDEX "CraftBoardDepositRequest_checkoutSessionId_idx" ON "CraftBoardDepositRequest"("checkoutSessionId");

ALTER TABLE "CraftBoardDepositRequest"
ADD CONSTRAINT "CraftBoardDepositRequest_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardDepositRequest"
ADD CONSTRAINT "CraftBoardDepositRequest_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "CraftBoardProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

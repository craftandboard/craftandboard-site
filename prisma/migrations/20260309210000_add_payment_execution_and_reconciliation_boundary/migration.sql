CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');
CREATE TYPE "PaymentExecutionMode" AS ENUM ('HOSTED_CHECKOUT', 'PAYMENT_LINK', 'MANUAL_PROVIDER_SESSION');
CREATE TYPE "PaymentExecutionStatus" AS ENUM ('CREATED', 'OPEN', 'COMPLETED', 'EXPIRED', 'CANCELED', 'FAILED');
CREATE TYPE "PaymentProviderEventProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');
CREATE TYPE "PaymentReconciliationAction" AS ENUM ('PAYMENT_MARKED_SUCCEEDED', 'PAYMENT_MARKED_FAILED', 'DEPOSIT_STATUS_SYNCED', 'EVENT_IGNORED', 'EVENT_DUPLICATE', 'EXECUTION_REFRESHED');
CREATE TYPE "PaymentReconciliationOutcome" AS ENUM ('APPLIED', 'SKIPPED', 'FAILED');

CREATE TABLE "PaymentExecution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "depositRequestId" TEXT,
    "paymentId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "mode" "PaymentExecutionMode" NOT NULL,
    "status" "PaymentExecutionStatus" NOT NULL DEFAULT 'CREATED',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "providerSessionId" TEXT,
    "providerPaymentIntentId" TEXT,
    "providerCustomerId" TEXT,
    "providerUrl" TEXT,
    "externalReference" TEXT,
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdByMembershipId" TEXT,
    "updatedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentProviderEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "providerObjectId" TEXT,
    "executionId" TEXT,
    "paymentId" TEXT,
    "depositRequestId" TEXT,
    "proposalId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processingStatus" "PaymentProviderEventProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProviderEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentReconciliationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "executionId" TEXT,
    "providerEventId" TEXT,
    "paymentId" TEXT,
    "depositRequestId" TEXT,
    "action" "PaymentReconciliationAction" NOT NULL,
    "outcome" "PaymentReconciliationOutcome" NOT NULL,
    "message" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentExecution_organizationId_proposalId_idx" ON "PaymentExecution"("organizationId", "proposalId");
CREATE INDEX "PaymentExecution_organizationId_paymentId_idx" ON "PaymentExecution"("organizationId", "paymentId");
CREATE INDEX "PaymentExecution_organizationId_provider_providerSessionId_idx" ON "PaymentExecution"("organizationId", "provider", "providerSessionId");
CREATE INDEX "PaymentExecution_organizationId_provider_providerPaymentIntentI_idx" ON "PaymentExecution"("organizationId", "provider", "providerPaymentIntentId");

CREATE UNIQUE INDEX "PaymentProviderEvent_organizationId_provider_providerEventI_key" ON "PaymentProviderEvent"("organizationId", "provider", "providerEventId");
CREATE UNIQUE INDEX "PaymentProviderEvent_organizationId_dedupeKey_key" ON "PaymentProviderEvent"("organizationId", "dedupeKey");
CREATE INDEX "PaymentProviderEvent_organizationId_processingStatus_idx" ON "PaymentProviderEvent"("organizationId", "processingStatus");

CREATE INDEX "PaymentReconciliationLog_organizationId_executionId_idx" ON "PaymentReconciliationLog"("organizationId", "executionId");

ALTER TABLE "PaymentExecution" ADD CONSTRAINT "PaymentExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentExecution" ADD CONSTRAINT "PaymentExecution_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentExecution" ADD CONSTRAINT "PaymentExecution_depositRequestId_fkey" FOREIGN KEY ("depositRequestId") REFERENCES "DepositRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentExecution" ADD CONSTRAINT "PaymentExecution_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "PaymentExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_depositRequestId_fkey" FOREIGN KEY ("depositRequestId") REFERENCES "DepositRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentReconciliationLog" ADD CONSTRAINT "PaymentReconciliationLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentReconciliationLog" ADD CONSTRAINT "PaymentReconciliationLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "PaymentExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentReconciliationLog" ADD CONSTRAINT "PaymentReconciliationLog_providerEventId_fkey" FOREIGN KEY ("providerEventId") REFERENCES "PaymentProviderEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentReconciliationLog" ADD CONSTRAINT "PaymentReconciliationLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentReconciliationLog" ADD CONSTRAINT "PaymentReconciliationLog_depositRequestId_fkey" FOREIGN KEY ("depositRequestId") REFERENCES "DepositRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

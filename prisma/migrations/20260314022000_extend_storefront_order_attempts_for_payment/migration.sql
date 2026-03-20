CREATE TYPE "CraftBoardStorefrontPaymentStatus" AS ENUM (
  'NOT_STARTED',
  'SESSION_CREATED',
  'PAYMENT_IN_PROGRESS',
  'PAID',
  'PAYMENT_FAILED',
  'CANCELLED',
  'EXPIRED'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
  ADD COLUMN "paymentStatus" "CraftBoardStorefrontPaymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "depositPercentBasisPoints" INTEGER,
  ADD COLUMN "depositAmountCents" INTEGER,
  ADD COLUMN "remainingBalanceAmountCents" INTEGER,
  ADD COLUMN "paymentProvider" TEXT,
  ADD COLUMN "paymentProviderSessionId" TEXT,
  ADD COLUMN "paymentProviderIntentId" TEXT,
  ADD COLUMN "paymentInitiatedAt" TIMESTAMP(3),
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "paymentFailureReason" TEXT,
  ADD COLUMN "fieldMetriqSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "confirmationCode" TEXT;

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_paymentStatus_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "paymentStatus");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_paymentProviderSessionId_idx"
  ON "CraftBoardStorefrontOrderAttempt"("paymentProviderSessionId");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_paymentProviderIntentId_idx"
  ON "CraftBoardStorefrontOrderAttempt"("paymentProviderIntentId");

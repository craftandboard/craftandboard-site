CREATE TYPE "CraftBoardNotificationEventCode" AS ENUM (
  'ORDER_PAYMENT_RECEIVED',
  'ORDER_CONFIRMATION_READY',
  'ORDER_STATUS_UPDATED',
  'ORDER_SHIPPED',
  'ORDER_NEEDS_ATTENTION'
);

CREATE TYPE "CraftBoardNotificationChannel" AS ENUM ('EMAIL');

CREATE TYPE "CraftBoardNotificationSendStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
ADD COLUMN "orderConfirmationEmailSentAt" TIMESTAMP(3),
ADD COLUMN "paymentReceiptEmailSentAt" TIMESTAMP(3),
ADD COLUMN "lastCustomerStatusEmailed" "CraftBoardCustomerOrderStatus",
ADD COLUMN "lastCustomerStatusEmailedAt" TIMESTAMP(3);

CREATE TABLE "CraftBoardNotificationLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "storefrontOrderAttemptId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "eventCode" "CraftBoardNotificationEventCode" NOT NULL,
  "channel" "CraftBoardNotificationChannel" NOT NULL DEFAULT 'EMAIL',
  "recipientEmail" TEXT NOT NULL,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "sendStatus" "CraftBoardNotificationSendStatus" NOT NULL DEFAULT 'PENDING',
  "sendAttemptedAt" TIMESTAMP(3),
  "sendSucceededAt" TIMESTAMP(3),
  "sendFailedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "dedupeKey" TEXT,
  "payloadSummaryJson" JSONB,

  CONSTRAINT "CraftBoardNotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CraftBoardNotificationLog_organizationId_createdAt_idx"
ON "CraftBoardNotificationLog"("organizationId", "createdAt");

CREATE INDEX "CraftBoardNotificationLog_organizationId_eventCode_idx"
ON "CraftBoardNotificationLog"("organizationId", "eventCode");

CREATE INDEX "CraftBoardNotificationLog_organizationId_sendStatus_idx"
ON "CraftBoardNotificationLog"("organizationId", "sendStatus");

CREATE INDEX "CraftBoardNotificationLog_storefrontOrderAttemptId_createdAt_idx"
ON "CraftBoardNotificationLog"("storefrontOrderAttemptId", "createdAt");

CREATE INDEX "CraftBoardNotificationLog_dedupeKey_idx"
ON "CraftBoardNotificationLog"("dedupeKey");

ALTER TABLE "CraftBoardNotificationLog"
ADD CONSTRAINT "CraftBoardNotificationLog_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardNotificationLog"
ADD CONSTRAINT "CraftBoardNotificationLog_storefrontOrderAttemptId_fkey"
FOREIGN KEY ("storefrontOrderAttemptId") REFERENCES "CraftBoardStorefrontOrderAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

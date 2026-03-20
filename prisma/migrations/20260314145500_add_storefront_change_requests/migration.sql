ALTER TYPE "CraftBoardNotificationEventCode" ADD VALUE IF NOT EXISTS 'ORDER_CHANGE_REQUEST_RECEIVED';
ALTER TYPE "CraftBoardNotificationEventCode" ADD VALUE IF NOT EXISTS 'ORDER_CHANGE_REQUEST_UPDATED';
ALTER TYPE "CraftBoardNotificationEventCode" ADD VALUE IF NOT EXISTS 'ORDER_CHANGE_REQUEST_RESOLVED';

CREATE TYPE "CraftBoardChangeRequestType" AS ENUM (
  'UPDATE_DIMENSIONS',
  'UPDATE_MATERIAL_OR_FINISH',
  'UPDATE_MOUNTING',
  'UPDATE_SHIPPING_ADDRESS',
  'HOLD_ORDER',
  'CANCEL_REQUEST',
  'GENERAL_CHANGE_REQUEST'
);

CREATE TYPE "CraftBoardChangeRequestStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_CUSTOMER_FOLLOWUP',
  'APPROVED_PENDING_UPDATE',
  'DECLINED',
  'CANCELLED',
  'RESOLVED'
);

CREATE TYPE "CraftBoardChangeRequestSubmissionStatus" AS ENUM (
  'NOT_SUBMITTED',
  'SUBMITTING',
  'SUBMITTED',
  'FAILED',
  'RETRY_PENDING',
  'SKIPPED'
);

CREATE TABLE "CraftBoardChangeRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "storefrontOrderAttemptId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "requestType" "CraftBoardChangeRequestType" NOT NULL,
  "status" "CraftBoardChangeRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "requestedByName" TEXT NOT NULL,
  "requestedByEmail" TEXT NOT NULL,
  "requestedByPhone" TEXT,
  "customerMessage" TEXT NOT NULL,
  "requestedChangesJson" JSONB NOT NULL,
  "customerSafeSummary" TEXT NOT NULL,
  "downstreamReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "fieldMetriqSubmissionStatus" "CraftBoardChangeRequestSubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  "fieldMetriqSubmissionAttemptedAt" TIMESTAMP(3),
  "fieldMetriqSubmissionSucceededAt" TIMESTAMP(3),
  "fieldMetriqSubmissionReference" TEXT,
  "fieldMetriqSubmissionError" TEXT,
  "resolutionCode" TEXT,
  "resolutionCustomerMessage" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "lastCustomerVisibleUpdateAt" TIMESTAMP(3),

  CONSTRAINT "CraftBoardChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CraftBoardChangeRequest_organizationId_createdAt_idx"
ON "CraftBoardChangeRequest"("organizationId", "createdAt");

CREATE INDEX "CraftBoardChangeRequest_storefrontOrderAttemptId_createdAt_idx"
ON "CraftBoardChangeRequest"("storefrontOrderAttemptId", "createdAt");

CREATE INDEX "CraftBoardChangeRequest_organizationId_status_idx"
ON "CraftBoardChangeRequest"("organizationId", "status");

CREATE INDEX "CraftBoardChangeRequest_organizationId_submissionStatus_idx"
ON "CraftBoardChangeRequest"("organizationId", "fieldMetriqSubmissionStatus");

ALTER TABLE "CraftBoardChangeRequest"
ADD CONSTRAINT "CraftBoardChangeRequest_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardChangeRequest"
ADD CONSTRAINT "CraftBoardChangeRequest_storefrontOrderAttemptId_fkey"
FOREIGN KEY ("storefrontOrderAttemptId") REFERENCES "CraftBoardStorefrontOrderAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

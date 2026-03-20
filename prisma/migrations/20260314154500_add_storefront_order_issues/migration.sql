CREATE TYPE "CraftBoardOrderIssueType" AS ENUM (
  'SHIPPING_DAMAGE',
  'MISSING_PARTS_OR_HARDWARE',
  'WRONG_ITEM_RECEIVED',
  'FINISH_OR_QUALITY_ISSUE',
  'DELIVERY_PROBLEM',
  'RETURN_REQUEST',
  'GENERAL_ORDER_ISSUE'
);

CREATE TYPE "CraftBoardOrderIssueStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_CUSTOMER_FOLLOWUP',
  'APPROVED_FOR_ACTION',
  'DECLINED',
  'CANCELLED',
  'RESOLVED'
);

CREATE TYPE "CraftBoardOrderIssueSubmissionStatus" AS ENUM (
  'NOT_SUBMITTED',
  'SUBMITTING',
  'SUBMITTED',
  'FAILED',
  'RETRY_PENDING',
  'SKIPPED'
);

ALTER TYPE "CraftBoardNotificationEventCode" ADD VALUE IF NOT EXISTS 'ORDER_ISSUE_REPORTED';
ALTER TYPE "CraftBoardNotificationEventCode" ADD VALUE IF NOT EXISTS 'ORDER_ISSUE_UPDATED';
ALTER TYPE "CraftBoardNotificationEventCode" ADD VALUE IF NOT EXISTS 'ORDER_ISSUE_RESOLVED';

CREATE TABLE "CraftBoardOrderIssue" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "storefrontOrderAttemptId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "issueType" "CraftBoardOrderIssueType" NOT NULL,
  "status" "CraftBoardOrderIssueStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reportedByName" TEXT NOT NULL,
  "reportedByEmail" TEXT NOT NULL,
  "reportedByPhone" TEXT,
  "customerMessage" TEXT NOT NULL,
  "issueDetailsJson" JSONB NOT NULL,
  "customerAttachmentSummaryJson" JSONB,
  "customerSafeSummary" TEXT NOT NULL,
  "downstreamReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "fieldMetriqSubmissionStatus" "CraftBoardOrderIssueSubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  "fieldMetriqSubmissionAttemptedAt" TIMESTAMP(3),
  "fieldMetriqSubmissionSucceededAt" TIMESTAMP(3),
  "fieldMetriqSubmissionReference" TEXT,
  "fieldMetriqSubmissionError" TEXT,
  "resolutionCode" TEXT,
  "resolutionCustomerMessage" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "lastCustomerVisibleUpdateAt" TIMESTAMP(3),
  CONSTRAINT "CraftBoardOrderIssue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CraftBoardOrderIssue_organizationId_createdAt_idx" ON "CraftBoardOrderIssue"("organizationId", "createdAt");
CREATE INDEX "CraftBoardOrderIssue_storefrontOrderAttemptId_createdAt_idx" ON "CraftBoardOrderIssue"("storefrontOrderAttemptId", "createdAt");
CREATE INDEX "CraftBoardOrderIssue_organizationId_status_idx" ON "CraftBoardOrderIssue"("organizationId", "status");
CREATE INDEX "CraftBoardOrderIssue_organizationId_fieldMetriqSubmissionStatus_idx" ON "CraftBoardOrderIssue"("organizationId", "fieldMetriqSubmissionStatus");

ALTER TABLE "CraftBoardOrderIssue"
ADD CONSTRAINT "CraftBoardOrderIssue_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardOrderIssue"
ADD CONSTRAINT "CraftBoardOrderIssue_storefrontOrderAttemptId_fkey"
FOREIGN KEY ("storefrontOrderAttemptId") REFERENCES "CraftBoardStorefrontOrderAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "CraftBoardStorefrontOrderAttemptStatus" AS ENUM (
  'RECEIVED',
  'LIVE_SUBMITTED',
  'FALLBACK_CAPTURED',
  'REVIEW_REQUIRED'
);

CREATE TYPE "CraftBoardStorefrontPaymentMode" AS ENUM (
  'DEPOSIT_REQUEST',
  'FULL_PAYMENT_LATER',
  'PAY_NOW_PLACEHOLDER'
);

CREATE TYPE "CraftBoardStorefrontOrderIntent" AS ENUM (
  'PURCHASE_STANDARD',
  'REQUEST_REVIEW'
);

CREATE TYPE "CraftBoardFieldMetriqSubmissionStatus" AS ENUM (
  'NOT_ATTEMPTED',
  'DISABLED',
  'SUCCEEDED',
  'FAILED',
  'REVIEW_REQUIRED'
);

CREATE TABLE "CraftBoardStorefrontOrderAttempt" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "resolvedInquiryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "requestId" TEXT NOT NULL,
  "status" "CraftBoardStorefrontOrderAttemptStatus" NOT NULL DEFAULT 'RECEIVED',
  "sourceChannel" TEXT NOT NULL,
  "productFamily" TEXT NOT NULL,
  "productSlug" TEXT NOT NULL,
  "configurationJson" JSONB NOT NULL,
  "pricingJson" JSONB NOT NULL,
  "customerJson" JSONB NOT NULL,
  "shippingJson" JSONB NOT NULL,
  "billingJson" JSONB,
  "paymentMode" "CraftBoardStorefrontPaymentMode" NOT NULL,
  "orderIntent" "CraftBoardStorefrontOrderIntent" NOT NULL,
  "instantPriceEligible" BOOLEAN NOT NULL DEFAULT false,
  "consultRequired" BOOLEAN NOT NULL DEFAULT false,
  "customerAcceptedPricingBasis" BOOLEAN NOT NULL DEFAULT false,
  "customerAcceptedLeadTimeBasis" BOOLEAN NOT NULL DEFAULT false,
  "customerAcknowledgedMadeToOrder" BOOLEAN NOT NULL DEFAULT false,
  "fieldMetriqSubmissionEnabled" BOOLEAN NOT NULL DEFAULT false,
  "fieldMetriqSubmissionAttemptedAt" TIMESTAMP(3),
  "fieldMetriqSubmissionStatus" "CraftBoardFieldMetriqSubmissionStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  "fieldMetriqSubmissionReference" TEXT,
  "fieldMetriqSubmissionError" TEXT,
  "fallbackReason" TEXT,
  "resolvedOrderId" TEXT,
  CONSTRAINT "CraftBoardStorefrontOrderAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CraftBoardStorefrontOrderAttempt_requestId_key"
  ON "CraftBoardStorefrontOrderAttempt"("requestId");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_createdAt_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "createdAt");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_status_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "status");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_productFamily_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "productFamily");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_fieldMetriqSubmissionStatus_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "fieldMetriqSubmissionStatus");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_fieldMetriqSubmissionReference_idx"
  ON "CraftBoardStorefrontOrderAttempt"("fieldMetriqSubmissionReference");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_resolvedInquiryId_idx"
  ON "CraftBoardStorefrontOrderAttempt"("resolvedInquiryId");

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
  ADD CONSTRAINT "CraftBoardStorefrontOrderAttempt_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
  ADD CONSTRAINT "CraftBoardStorefrontOrderAttempt_resolvedInquiryId_fkey"
  FOREIGN KEY ("resolvedInquiryId") REFERENCES "CraftBoardInquiry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

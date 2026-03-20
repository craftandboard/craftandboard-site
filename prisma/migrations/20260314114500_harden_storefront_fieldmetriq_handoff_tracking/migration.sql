ALTER TYPE "CraftBoardFieldMetriqSubmissionStatus" ADD VALUE IF NOT EXISTS 'SUBMITTING';
ALTER TYPE "CraftBoardFieldMetriqSubmissionStatus" ADD VALUE IF NOT EXISTS 'RETRY_PENDING';
ALTER TYPE "CraftBoardFieldMetriqSubmissionStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';

CREATE TYPE "CraftBoardFulfillmentClass" AS ENUM (
  'STANDARD_PARCEL_BUILD',
  'OVERSIZE_PARCEL_BUILD',
  'FREIGHT_BUILD',
  'MANUAL_REVIEW_BUILD'
);

CREATE TYPE "CraftBoardProductionProfile" AS ENUM (
  'FLOATING_SHELF_STANDARD',
  'FLOATING_MANTEL_STANDARD'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
ADD COLUMN "fieldMetriqSubmissionSucceededAt" TIMESTAMP(3),
ADD COLUMN "fieldMetriqSubmissionRetryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "fieldMetriqFulfillmentClass" "CraftBoardFulfillmentClass",
ADD COLUMN "fieldMetriqProductionProfile" "CraftBoardProductionProfile";

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_fieldMetriqFulfill_key"
ON "CraftBoardStorefrontOrderAttempt"("organizationId", "fieldMetriqFulfillmentClass");

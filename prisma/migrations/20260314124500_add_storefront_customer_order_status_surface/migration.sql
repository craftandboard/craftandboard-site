CREATE TYPE "CraftBoardCustomerOrderStatus" AS ENUM (
  'PAYMENT_RECEIVED',
  'ORDER_RECEIVED',
  'IN_REVIEW',
  'IN_PRODUCTION',
  'PREPARING_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'NEEDS_ATTENTION'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
ADD COLUMN "customerStatusToken" TEXT,
ADD COLUMN "customerStatusTokenCreatedAt" TIMESTAMP(3),
ADD COLUMN "latestCustomerOrderStatus" "CraftBoardCustomerOrderStatus",
ADD COLUMN "latestCustomerOrderStatusLabel" TEXT,
ADD COLUMN "latestCustomerStatusUpdatedAt" TIMESTAMP(3),
ADD COLUMN "fieldMetriqOrderReference" TEXT,
ADD COLUMN "fieldMetriqOrderStatusSnapshotJson" JSONB,
ADD COLUMN "fieldMetriqLastStatusSyncAt" TIMESTAMP(3),
ADD COLUMN "customerStatusTimelineJson" JSONB,
ADD COLUMN "customerStatusLastViewedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CraftBoardStorefrontOrderAttempt_customerStatusToken_key"
ON "CraftBoardStorefrontOrderAttempt"("customerStatusToken");

CREATE INDEX "CBStorefrontAttempt_org_latest_customer_status_idx"
ON "CraftBoardStorefrontOrderAttempt"("organizationId", "latestCustomerOrderStatus");

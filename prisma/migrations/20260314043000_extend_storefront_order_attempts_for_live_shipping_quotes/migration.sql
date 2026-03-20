CREATE TYPE "CraftBoardStorefrontShippingQuoteSource" AS ENUM (
  'LIVE_PROVIDER',
  'ESTIMATE_RULES',
  'MANUAL_REVIEW'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
  ADD COLUMN "shippingQuoteSource" "CraftBoardStorefrontShippingQuoteSource",
  ADD COLUMN "shippingCarrierName" TEXT,
  ADD COLUMN "shippingServiceLevel" TEXT,
  ADD COLUMN "shippingQuoteReference" TEXT,
  ADD COLUMN "shippingQuoteExpiresAt" TIMESTAMP(3),
  ADD COLUMN "shippingQuoteGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "shippingFallbackUsed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "shippingProviderSummaryJson" JSONB;

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_shippingQuoteSource_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "shippingQuoteSource");

CREATE INDEX "CraftBoardStorefrontOrderAttempt_shippingQuoteReference_idx"
  ON "CraftBoardStorefrontOrderAttempt"("shippingQuoteReference");

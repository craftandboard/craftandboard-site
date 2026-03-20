CREATE TYPE "CraftBoardStorefrontTaxQuoteSource" AS ENUM (
  'LIVE_PROVIDER',
  'ESTIMATE_RULES',
  'NOT_APPLICABLE',
  'MANUAL_REVIEW'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
  ADD COLUMN "taxAmountCents" INTEGER,
  ADD COLUMN "taxableSubtotalCents" INTEGER,
  ADD COLUMN "taxableShippingCents" INTEGER,
  ADD COLUMN "taxReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "taxQuoteSource" "CraftBoardStorefrontTaxQuoteSource",
  ADD COLUMN "taxRateBasisPoints" INTEGER,
  ADD COLUMN "taxBasisVersion" TEXT,
  ADD COLUMN "taxQuoteGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "taxQuoteExpiresAt" TIMESTAMP(3),
  ADD COLUMN "taxFallbackUsed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "taxJurisdictionSummaryJson" JSONB,
  ADD COLUMN "taxWarningsJson" JSONB,
  ADD COLUMN "taxReasonCodesJson" JSONB,
  ADD COLUMN "taxProviderSummaryJson" JSONB;

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_taxQuoteSource_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "taxQuoteSource");

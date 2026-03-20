CREATE TYPE "CraftBoardStorefrontShippingMode" AS ENUM (
  'PARCEL',
  'OVERSIZE_PARCEL',
  'LTL_FREIGHT',
  'LOCAL_DELIVERY',
  'PICKUP',
  'REVIEW_REQUIRED'
);

CREATE TYPE "CraftBoardStorefrontPackagingProfile" AS ENUM (
  'long_shelf_box',
  'mantel_box',
  'long_oversize_box',
  'mantel_crate',
  'freight_pallet'
);

ALTER TABLE "CraftBoardStorefrontOrderAttempt"
  ADD COLUMN "shippingMode" "CraftBoardStorefrontShippingMode",
  ADD COLUMN "packagingProfile" "CraftBoardStorefrontPackagingProfile",
  ADD COLUMN "shippingCostCents" INTEGER,
  ADD COLUMN "shippingReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "estimatedTransitDays" INTEGER,
  ADD COLUMN "destinationZone" TEXT,
  ADD COLUMN "shippingBasisVersion" TEXT,
  ADD COLUMN "shippingEstimateJson" JSONB,
  ADD COLUMN "shippingWarningsJson" JSONB;

CREATE INDEX "CraftBoardStorefrontOrderAttempt_organizationId_shippingMode_idx"
  ON "CraftBoardStorefrontOrderAttempt"("organizationId", "shippingMode");

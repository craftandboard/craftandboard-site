CREATE TYPE "LaunchRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "LaunchGuardrailProfile" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "costProfileId" TEXT,
  "name" TEXT NOT NULL,
  "status" "CostProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "minimumMarginPct" DECIMAL(8,3) NOT NULL,
  "minimumBufferAboveBreakEvenPct" DECIMAL(8,3),
  "maximumFeeBurdenPct" DECIMAL(8,3),
  "maximumShippingBurdenPct" DECIMAL(8,3),
  "maximumReserveBurdenPct" DECIMAL(8,3),
  "maximumAllowedTargetToFloorGapPct" DECIMAL(8,3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaunchGuardrailProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CalculationScenario"
  ADD COLUMN "guardrailProfileId" TEXT,
  ADD COLUMN "riskScore" DECIMAL(12,4),
  ADD COLUMN "riskLevel" "LaunchRiskLevel",
  ADD COLUMN "guardrailSnapshot" JSONB,
  ADD COLUMN "warningSnapshot" JSONB,
  ADD COLUMN "handoffSnapshot" JSONB,
  ADD COLUMN "isLaunchApprovedCandidate" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CalculationComparisonSet"
  ADD COLUMN "selectedLaunchScenarioId" TEXT,
  ADD COLUMN "selectedLaunchSummary" JSONB,
  ADD COLUMN "riskSummary" JSONB;

CREATE INDEX "LaunchGuardrailProfile_organizationId_status_idx"
  ON "LaunchGuardrailProfile"("organizationId", "status");

CREATE INDEX "LaunchGuardrailProfile_organizationId_costProfileId_idx"
  ON "LaunchGuardrailProfile"("organizationId", "costProfileId");

CREATE INDEX "CalculationScenario_organizationId_riskLevel_idx"
  ON "CalculationScenario"("organizationId", "riskLevel");

CREATE INDEX "CalculationComparisonSet_organizationId_selectedLaunchScenarioId_idx"
  ON "CalculationComparisonSet"("organizationId", "selectedLaunchScenarioId");

ALTER TABLE "LaunchGuardrailProfile"
  ADD CONSTRAINT "LaunchGuardrailProfile_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LaunchGuardrailProfile"
  ADD CONSTRAINT "LaunchGuardrailProfile_costProfileId_fkey"
  FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalculationScenario"
  ADD CONSTRAINT "CalculationScenario_guardrailProfileId_fkey"
  FOREIGN KEY ("guardrailProfileId") REFERENCES "LaunchGuardrailProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalculationComparisonSet"
  ADD CONSTRAINT "CalculationComparisonSet_selectedLaunchScenarioId_fkey"
  FOREIGN KEY ("selectedLaunchScenarioId") REFERENCES "CalculationScenario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

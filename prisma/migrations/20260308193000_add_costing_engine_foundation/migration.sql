-- CreateEnum
CREATE TYPE "CostScenarioSourceType" AS ENUM ('MANUAL', 'CONFIGURATOR', 'ORDER', 'BATCH', 'FORECAST');

-- CreateTable
CREATE TABLE "CostProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostRate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "costProfileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueDecimal" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostScenario" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "costProfileId" TEXT NOT NULL,
    "name" TEXT,
    "sourceType" "CostScenarioSourceType" NOT NULL,
    "sourceId" TEXT,
    "inputJson" JSONB NOT NULL,
    "resultJson" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostProfile_organizationId_isDefault_idx" ON "CostProfile"("organizationId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "CostRate_costProfileId_key_effectiveFrom_key" ON "CostRate"("costProfileId", "key", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CostRate_organizationId_costProfileId_idx" ON "CostRate"("organizationId", "costProfileId");

-- CreateIndex
CREATE INDEX "CostRate_costProfileId_key_effectiveTo_idx" ON "CostRate"("costProfileId", "key", "effectiveTo");

-- CreateIndex
CREATE INDEX "CostScenario_organizationId_costProfileId_createdAt_idx" ON "CostScenario"("organizationId", "costProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "CostScenario_organizationId_sourceType_createdAt_idx" ON "CostScenario"("organizationId", "sourceType", "createdAt");

-- CreateIndex
CREATE INDEX "CostScenario_createdByUserId_idx" ON "CostScenario"("createdByUserId");

-- AddForeignKey
ALTER TABLE "CostProfile" ADD CONSTRAINT "CostProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRate" ADD CONSTRAINT "CostRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRate" ADD CONSTRAINT "CostRate_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostScenario" ADD CONSTRAINT "CostScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostScenario" ADD CONSTRAINT "CostScenario_costProfileId_fkey" FOREIGN KEY ("costProfileId") REFERENCES "CostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostScenario" ADD CONSTRAINT "CostScenario_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

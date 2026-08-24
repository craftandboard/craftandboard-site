-- CreateEnum
CREATE TYPE "HqDocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'NEEDS_SIGNATURE', 'SIGNED');

-- CreateTable
CREATE TABLE "HqDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "agreedBy" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HqDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HqPartnerResponse" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "question" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HqPartnerResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HqDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "HqDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HqDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HqPartnerResponseRevision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "question" INTEGER NOT NULL,
    "previousBody" TEXT NOT NULL,
    "newBody" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HqPartnerResponseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HqDecision_organizationId_decidedAt_idx" ON "HqDecision"("organizationId", "decidedAt");

-- CreateIndex
CREATE INDEX "HqDecision_organizationId_createdAt_idx" ON "HqDecision"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "HqPartnerResponse_organizationId_question_idx" ON "HqPartnerResponse"("organizationId", "question");

-- CreateIndex
CREATE UNIQUE INDEX "HqPartnerResponse_organizationId_personName_question_key" ON "HqPartnerResponse"("organizationId", "personName", "question");

-- CreateIndex
CREATE INDEX "HqDocument_organizationId_sortOrder_idx" ON "HqDocument"("organizationId", "sortOrder");

-- CreateIndex
CREATE INDEX "HqDocument_organizationId_status_idx" ON "HqDocument"("organizationId", "status");

-- CreateIndex
CREATE INDEX "HqPartnerResponseRevision_organizationId_responseId_created_idx" ON "HqPartnerResponseRevision"("organizationId", "responseId", "createdAt");

-- CreateIndex
CREATE INDEX "HqPartnerResponseRevision_organizationId_personName_questio_idx" ON "HqPartnerResponseRevision"("organizationId", "personName", "question");


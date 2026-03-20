CREATE TYPE "CraftBoardOutreachTargetStatus" AS ENUM (
  'PROSPECT',
  'QUALIFIED',
  'CONTACTED',
  'FOLLOW_UP_DUE',
  'RESPONDED',
  'WON',
  'REJECTED',
  'DEFERRED'
);

CREATE TYPE "CraftBoardOutreachTargetSource" AS ENUM (
  'SEEDED',
  'MANUAL',
  'IMPORTED'
);

CREATE TYPE "CraftBoardOutreachActivityType" AS ENUM (
  'NOTE',
  'CONTACT_ATTEMPT',
  'FOLLOW_UP',
  'RESPONSE',
  'LINK_WON',
  'REJECTION',
  'STATUS_CHANGE'
);

CREATE TABLE "CraftBoardOutreachTarget" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "domain" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "authorityTier" TEXT NOT NULL,
  "topicCluster" TEXT NOT NULL,
  "fitNotes" TEXT NOT NULL,
  "preferredAssetTypes" TEXT[] NOT NULL,
  "preferredCampaignKeys" TEXT[] NOT NULL,
  "status" "CraftBoardOutreachTargetStatus" NOT NULL DEFAULT 'PROSPECT',
  "primaryContactName" TEXT,
  "primaryContactEmail" TEXT,
  "contactMethod" TEXT,
  "lastContactedAt" TIMESTAMP(3),
  "nextFollowUpAt" TIMESTAMP(3),
  "lastResponseAt" TIMESTAMP(3),
  "notes" TEXT,
  "source" "CraftBoardOutreachTargetSource" NOT NULL,
  "isSeeded" BOOLEAN NOT NULL DEFAULT false,
  "sourceKey" TEXT,
  CONSTRAINT "CraftBoardOutreachTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CraftBoardOutreachActivity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "outreachTargetId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activityType" "CraftBoardOutreachActivityType" NOT NULL,
  "campaignKey" TEXT,
  "assetPageKey" TEXT,
  "note" TEXT NOT NULL,
  "outcome" TEXT,
  "nextFollowUpAt" TIMESTAMP(3),
  CONSTRAINT "CraftBoardOutreachActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CraftBoardOutreachTarget_organizationId_domain_key" ON "CraftBoardOutreachTarget"("organizationId", "domain");
CREATE UNIQUE INDEX "CraftBoardOutreachTarget_organizationId_sourceKey_key" ON "CraftBoardOutreachTarget"("organizationId", "sourceKey");
CREATE INDEX "CraftBoardOutreachTarget_organizationId_createdAt_idx" ON "CraftBoardOutreachTarget"("organizationId", "createdAt");
CREATE INDEX "CraftBoardOutreachTarget_organizationId_status_idx" ON "CraftBoardOutreachTarget"("organizationId", "status");
CREATE INDEX "CraftBoardOutreachTarget_organizationId_targetType_idx" ON "CraftBoardOutreachTarget"("organizationId", "targetType");
CREATE INDEX "CraftBoardOutreachTarget_organizationId_authorityTier_idx" ON "CraftBoardOutreachTarget"("organizationId", "authorityTier");
CREATE INDEX "CraftBoardOutreachTarget_organizationId_nextFollowUpAt_idx" ON "CraftBoardOutreachTarget"("organizationId", "nextFollowUpAt");

CREATE INDEX "CraftBoardOutreachActivity_organizationId_createdAt_idx" ON "CraftBoardOutreachActivity"("organizationId", "createdAt");
CREATE INDEX "CraftBoardOutreachActivity_organizationId_campaignKey_idx" ON "CraftBoardOutreachActivity"("organizationId", "campaignKey");
CREATE INDEX "CraftBoardOutreachActivity_outreachTargetId_createdAt_idx" ON "CraftBoardOutreachActivity"("outreachTargetId", "createdAt");

ALTER TABLE "CraftBoardOutreachTarget"
ADD CONSTRAINT "CraftBoardOutreachTarget_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardOutreachActivity"
ADD CONSTRAINT "CraftBoardOutreachActivity_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CraftBoardOutreachActivity"
ADD CONSTRAINT "CraftBoardOutreachActivity_outreachTargetId_fkey"
FOREIGN KEY ("outreachTargetId") REFERENCES "CraftBoardOutreachTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

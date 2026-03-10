CREATE TYPE "PilotFeedbackArea" AS ENUM ('LEADS', 'PROPOSALS', 'PUBLIC_ACCEPTANCE', 'PROJECTS', 'GENERAL');
CREATE TYPE "PilotFeedbackSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BLOCKER');
CREATE TYPE "PilotFeedbackStatus" AS ENUM ('NEW', 'REVIEWED', 'RESOLVED');

CREATE TABLE "PilotFeedback" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "membershipId" TEXT,
  "area" "PilotFeedbackArea" NOT NULL,
  "severity" "PilotFeedbackSeverity" NOT NULL,
  "status" "PilotFeedbackStatus" NOT NULL DEFAULT 'NEW',
  "pagePath" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "reproductionNotes" TEXT,
  "screenshotUrl" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PilotFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PilotFeedback_organizationId_status_idx" ON "PilotFeedback"("organizationId", "status");
CREATE INDEX "PilotFeedback_organizationId_area_idx" ON "PilotFeedback"("organizationId", "area");
CREATE INDEX "PilotFeedback_organizationId_severity_idx" ON "PilotFeedback"("organizationId", "severity");
CREATE INDEX "PilotFeedback_organizationId_createdAt_idx" ON "PilotFeedback"("organizationId", "createdAt");

ALTER TABLE "PilotFeedback"
ADD CONSTRAINT "PilotFeedback_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import type { PilotFeedbackSummaryView, PilotFeedbackView } from "./contracts.js";
import {
  createPilotFeedbackRecord,
  getPilotFeedbackById,
  listPilotFeedbackForOrganization,
  updatePilotFeedbackRecord
} from "./repository.js";

type PilotFeedbackRecord = {
  id: string;
  organizationId: string;
  membershipId: string | null;
  area: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status: "NEW" | "REVIEWED" | "RESOLVED";
  pagePath: string | null;
  title: string;
  message: string;
  reproductionNotes: string | null;
  screenshotUrl: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function mapFeedback(record: PilotFeedbackRecord): PilotFeedbackView {
  return {
    id: record.id,
    orgId: record.organizationId,
    membershipId: record.membershipId,
    area: record.area,
    severity: record.severity,
    status: record.status,
    pagePath: record.pagePath,
    title: record.title,
    message: record.message,
    reproductionNotes: record.reproductionNotes,
    screenshotUrl: record.screenshotUrl,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function summarizeFeedback(records: PilotFeedbackRecord[]): PilotFeedbackSummaryView {
  const openRecords = records.filter((record) => record.status !== "RESOLVED");
  const latest = records[0]?.createdAt ?? null;

  return {
    openBlockerCount: openRecords.filter((record) => record.severity === "BLOCKER").length,
    openHighSeverityCount: openRecords.filter((record) =>
      record.severity === "BLOCKER" || record.severity === "HIGH"
    ).length,
    openCount: openRecords.length,
    latestSubmittedAt: latest ? latest.toISOString() : null
  };
}

export async function createPilotFeedback(input: {
  organizationId: string;
  membershipId?: string | null;
  area: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  pagePath?: string | null;
  title: string;
  message: string;
  reproductionNotes?: string | null;
  screenshotUrl?: string | null;
  metadata?: unknown;
}) {
  const feedback = (await createPilotFeedbackRecord(input)) as PilotFeedbackRecord;

  return {
    ok: true,
    feedback: mapFeedback(feedback)
  };
}

export async function listPilotFeedback(input: {
  organizationId: string;
  area?: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status?: "NEW" | "REVIEWED" | "RESOLVED";
}) {
  const feedback = (await listPilotFeedbackForOrganization(input)) as PilotFeedbackRecord[];

  return {
    ok: true,
    feedback: feedback.map(mapFeedback),
    summary: summarizeFeedback(feedback)
  };
}

export async function updatePilotFeedback(input: {
  organizationId: string;
  feedbackId: string;
  status?: "NEW" | "REVIEWED" | "RESOLVED";
}) {
  const current = (await getPilotFeedbackById(input)) as PilotFeedbackRecord | null;

  if (!current) {
    throw new Error("Pilot feedback not found.");
  }

  await updatePilotFeedbackRecord(input);

  const updated = (await getPilotFeedbackById(input)) as PilotFeedbackRecord | null;
  if (!updated) {
    throw new Error("Pilot feedback not found.");
  }

  return {
    ok: true,
    feedback: mapFeedback(updated)
  };
}

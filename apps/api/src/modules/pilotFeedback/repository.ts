import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function createPilotFeedbackRecord(input: {
  organizationId: string;
  membershipId?: string | null;
  area: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status?: "NEW" | "REVIEWED" | "RESOLVED";
  pagePath?: string | null;
  title: string;
  message: string;
  reproductionNotes?: string | null;
  screenshotUrl?: string | null;
  metadata?: unknown;
}) {
  return prismaClient.pilotFeedback.create({
    data: {
      organizationId: input.organizationId,
      membershipId: input.membershipId ?? null,
      area: input.area,
      severity: input.severity,
      status: input.status ?? "NEW",
      pagePath: input.pagePath ?? null,
      title: input.title,
      message: input.message,
      reproductionNotes: input.reproductionNotes ?? null,
      screenshotUrl: input.screenshotUrl ?? null,
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function getPilotFeedbackById(input: {
  organizationId: string;
  feedbackId: string;
}) {
  return prismaClient.pilotFeedback.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.feedbackId
    }
  });
}

export async function listPilotFeedbackForOrganization(input: {
  organizationId: string;
  area?: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status?: "NEW" | "REVIEWED" | "RESOLVED";
}) {
  return prismaClient.pilotFeedback.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.area ? { area: input.area } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
      ...(input.status ? { status: input.status } : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function updatePilotFeedbackRecord(input: {
  organizationId: string;
  feedbackId: string;
  status?: "NEW" | "REVIEWED" | "RESOLVED";
}) {
  return prismaClient.pilotFeedback.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.feedbackId
    },
    data: {
      ...(input.status ? { status: input.status } : {})
    }
  });
}

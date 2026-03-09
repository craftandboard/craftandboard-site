import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { applyStageCandidateAction } from "./apply.js";
import { deriveStageCandidateDrafts } from "./generation.js";
import { buildStageCandidateWhere } from "./selectors.js";
import { markStageCandidateRejected } from "./review.js";

function mapCandidate(candidate: Awaited<ReturnType<typeof prisma.stageCandidateSignal.findFirstOrThrow>> & {
  sourceMachine?: { id: string; code: string; name: string; type: string } | null;
  sourceMachineEvent?: { id: string; eventType: string; eventTs: Date; processingStatus: string } | null;
  targetBatch?: { id: string; code: string; status: string } | null;
  targetManufacturingJob?: { id: string; labelCode: string; status: string } | null;
  targetPart?: { id: string; scanCode: string; partCode: string; status: string } | null;
  autoAppliedByRule?: { id: string; candidateAction: string; machineId: string | null; machineType: string | null } | null;
}) {
  const canApply = candidate.status === "OPEN" && !candidate.recommendedAction.startsWith("MARK_JOB_EDGE");

  return {
    id: candidate.id,
    targetType: candidate.targetType,
    candidateStage: candidate.candidateStage,
    currentStage: candidate.currentStage ?? undefined,
    recommendedAction: candidate.recommendedAction,
    confidence: candidate.confidence,
    rationale: candidate.rationale,
    status: candidate.status,
    appliedMode: candidate.appliedMode ?? undefined,
    rejectionReason: candidate.rejectionReason ?? undefined,
    notes: candidate.notes ?? undefined,
    reviewedAt: candidate.reviewedAt?.toISOString(),
    appliedAt: candidate.appliedAt?.toISOString(),
    autoAppliedAt: candidate.autoAppliedAt?.toISOString(),
    autoApplyRationale: candidate.autoApplyRationale ?? undefined,
    rejectedAt: candidate.rejectedAt?.toISOString(),
    createdAt: candidate.createdAt.toISOString(),
    canApply,
    sourceMachine: candidate.sourceMachine
      ? {
          id: candidate.sourceMachine.id,
          code: candidate.sourceMachine.code,
          name: candidate.sourceMachine.name,
          type: candidate.sourceMachine.type
        }
      : undefined,
    sourceMachineEvent: candidate.sourceMachineEvent
      ? {
          id: candidate.sourceMachineEvent.id,
          eventType: candidate.sourceMachineEvent.eventType,
          eventTs: candidate.sourceMachineEvent.eventTs.toISOString(),
          processingStatus: candidate.sourceMachineEvent.processingStatus
        }
      : undefined,
    targetBatch: candidate.targetBatch
      ? {
          id: candidate.targetBatch.id,
          code: candidate.targetBatch.code,
          status: candidate.targetBatch.status
        }
      : undefined,
    targetManufacturingJob: candidate.targetManufacturingJob
      ? {
          id: candidate.targetManufacturingJob.id,
          labelCode: candidate.targetManufacturingJob.labelCode,
          status: candidate.targetManufacturingJob.status
        }
      : undefined,
    targetPart: candidate.targetPart
      ? {
          id: candidate.targetPart.id,
          scanCode: candidate.targetPart.scanCode,
          partCode: candidate.targetPart.partCode,
          status: candidate.targetPart.status
        }
      : undefined,
    autoAppliedByRule: candidate.autoAppliedByRule
      ? {
          id: candidate.autoAppliedByRule.id,
          candidateAction: candidate.autoAppliedByRule.candidateAction,
          machineId: candidate.autoAppliedByRule.machineId ?? undefined,
          machineType: candidate.autoAppliedByRule.machineType ?? undefined
        }
      : undefined
  };
}

const candidateInclude = {
  sourceMachine: {
    select: { id: true, code: true, name: true, type: true }
  },
  sourceMachineEvent: {
    select: { id: true, eventType: true, eventTs: true, processingStatus: true }
  },
  targetBatch: {
    select: { id: true, code: true, status: true }
  },
  targetManufacturingJob: {
    select: { id: true, labelCode: true, status: true }
  },
  targetPart: {
    select: { id: true, scanCode: true, partCode: true, status: true }
  },
  autoAppliedByRule: {
    select: { id: true, candidateAction: true, machineId: true, machineType: true }
  }
} as const;

async function finalizeAppliedStageCandidateSignal(
  candidateId: string,
  input: {
    organizationId: string;
    reviewedByMemberId?: string;
    note?: string;
    mode: "MANUAL" | "AUTO";
    autoAppliedByRuleId?: string;
    autoApplyRationale?: string;
  }
) {
  const candidate = await prisma.stageCandidateSignal.findFirst({
    where: {
      id: candidateId,
      organizationId: input.organizationId
    },
    include: candidateInclude
  });

  if (!candidate) {
    throw new Error("Stage candidate signal not found.");
  }

  if (candidate.status !== "OPEN") {
    throw new Error(`Stage candidate signal ${candidate.id} is already ${candidate.status}.`);
  }

  const appliedResult = await applyStageCandidateAction({
    organizationId: input.organizationId,
    action: candidate.recommendedAction,
    targetBatchId: candidate.targetBatchId,
    targetPartId: candidate.targetPartId,
    targetManufacturingJobId: candidate.targetManufacturingJobId
  });

  const now = new Date();
  const updated = await prisma.stageCandidateSignal.update({
    where: { id: candidate.id },
    data: {
      status: "APPLIED",
      appliedMode: input.mode,
      reviewedByMemberId: input.reviewedByMemberId ?? null,
      reviewedAt: now,
      appliedAt: now,
      autoAppliedAt: input.mode === "AUTO" ? now : null,
      autoAppliedByRuleId: input.mode === "AUTO" ? input.autoAppliedByRuleId ?? null : null,
      autoApplyRationale: input.mode === "AUTO" ? input.autoApplyRationale ?? null : null,
      notes: input.note !== undefined ? input.note.trim() || null : candidate.notes
    },
    include: candidateInclude
  });

  return {
    ok: true as const,
    candidate: mapCandidate(updated),
    appliedResult
  };
}

export async function generateStageCandidatesForMachineEvent(machineEventId: string, organizationId: string) {
  const event = await prisma.machineEvent.findFirst({
    where: {
      id: machineEventId,
      organizationId
    },
    include: {
      machine: {
        select: { id: true, type: true }
      },
      linkedBatch: {
        select: { id: true, status: true }
      },
      linkedManufacturingJob: {
        select: { id: true, status: true }
      },
      linkedPart: {
        select: { id: true, status: true }
      }
    }
  });

  if (!event || event.processingStatus !== "LINKED") {
    return [];
  }

  const drafts = deriveStageCandidateDrafts({
    id: event.id,
    eventType: event.eventType,
    machine: event.machine,
    linkedBatchId: event.linkedBatchId,
    linkedManufacturingJobId: event.linkedManufacturingJobId,
    linkedPartId: event.linkedPartId,
    linkedBatch: event.linkedBatch,
    linkedManufacturingJob: event.linkedManufacturingJob,
    linkedPart: event.linkedPart
  });

  const created = [];

  for (const draft of drafts) {
    const duplicate = await prisma.stageCandidateSignal.findFirst({
      where: {
        organizationId,
        sourceMachineEventId: event.id,
        recommendedAction: draft.recommendedAction,
        targetType: draft.targetType,
        targetBatchId: draft.targetBatchId ?? null,
        targetManufacturingJobId: draft.targetManufacturingJobId ?? null,
        targetPartId: draft.targetPartId ?? null,
        status: "OPEN"
      }
    });

    if (duplicate) {
      continue;
    }

    const candidate = await prisma.stageCandidateSignal.create({
      data: {
        organizationId,
        sourceMachineEventId: event.id,
        sourceMachineId: event.machineId,
        targetType: draft.targetType,
        targetBatchId: draft.targetBatchId ?? null,
        targetManufacturingJobId: draft.targetManufacturingJobId ?? null,
        targetPartId: draft.targetPartId ?? null,
        candidateStage: draft.candidateStage,
        currentStage: draft.currentStage ?? null,
        recommendedAction: draft.recommendedAction,
        confidence: draft.confidence,
        rationale: draft.rationale
      },
      include: candidateInclude
    });

    created.push(mapCandidate(candidate));
  }

  return created;
}

export async function safeGenerateStageCandidatesForMachineEvent(machineEventId: string, organizationId: string) {
  try {
    return await generateStageCandidatesForMachineEvent(machineEventId, organizationId);
  } catch (error) {
    logger.error("Stage candidate generation failed", { machineEventId, organizationId, error });
    return [];
  }
}

export async function listStageCandidateSignals(
  input: {
    status?: string;
    targetType?: string;
    machineId?: string;
    batchId?: string;
    recommendedAction?: string;
  },
  organizationId: string
) {
  const candidates = await prisma.stageCandidateSignal.findMany({
    where: buildStageCandidateWhere({
      organizationId,
      status: input.status,
      targetType: input.targetType,
      machineId: input.machineId,
      batchId: input.batchId,
      recommendedAction: input.recommendedAction
    }),
    include: candidateInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return {
    ok: true as const,
    summary: {
      openCount: candidates.filter((candidate) => candidate.status === "OPEN").length,
      appliedCount: candidates.filter((candidate) => candidate.status === "APPLIED").length,
      rejectedCount: candidates.filter((candidate) => candidate.status === "REJECTED").length
    },
    candidates: candidates.map(mapCandidate)
  };
}

export async function getStageCandidateSignal(candidateId: string, organizationId: string) {
  const candidate = await prisma.stageCandidateSignal.findFirst({
    where: {
      id: candidateId,
      organizationId
    },
    include: candidateInclude
  });

  if (!candidate) {
    throw new Error("Stage candidate signal not found.");
  }

  return {
    ok: true as const,
    candidate: mapCandidate(candidate)
  };
}

export async function applyStageCandidateSignal(
  candidateId: string,
  input: {
    reviewedByMemberId: string;
    note?: string;
  },
  organizationId: string
) {
  return finalizeAppliedStageCandidateSignal(candidateId, {
    organizationId,
    reviewedByMemberId: input.reviewedByMemberId,
    note: input.note,
    mode: "MANUAL"
  });
}

export async function autoApplyStageCandidateSignal(
  candidateId: string,
  input: {
    ruleId: string;
    rationale: string;
  },
  organizationId: string
) {
  return finalizeAppliedStageCandidateSignal(candidateId, {
    organizationId,
    mode: "AUTO",
    autoAppliedByRuleId: input.ruleId,
    autoApplyRationale: input.rationale
  });
}

export async function rejectStageCandidateSignal(
  candidateId: string,
  input: {
    reviewedByMemberId: string;
    rejectionReason: string;
  },
  organizationId: string
) {
  const candidate = await markStageCandidateRejected({
    candidateId,
    organizationId,
    memberId: input.reviewedByMemberId,
    rejectionReason: input.rejectionReason
  });

  const reloaded = await prisma.stageCandidateSignal.findFirstOrThrow({
    where: { id: candidate.id },
    include: candidateInclude
  });

  return {
    ok: true as const,
    candidate: mapCandidate(reloaded)
  };
}

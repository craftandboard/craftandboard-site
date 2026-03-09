import { prisma } from "../../lib/prisma.js";
import { linkMachineEventToContext } from "./linking.js";
import { normalizeMachineEventInput } from "./normalization.js";
import { buildMachineEventWhere, resolveMachineByIdOrCode } from "./selectors.js";
import { safeGenerateStageCandidatesForMachineEvent } from "../stageSignals/service.js";
import { evaluateTrustedAutoApplyForCandidate } from "../trustedAutoApply/evaluation.js";

function mapMachine(machine: Awaited<ReturnType<typeof prisma.machine.findFirstOrThrow>>) {
  return {
    id: machine.id,
    code: machine.code,
    name: machine.name,
    type: machine.type,
    status: machine.status,
    locationLabel: machine.locationLabel ?? undefined,
    adapterType: machine.adapterType ?? undefined,
    notes: machine.notes ?? undefined,
    createdAt: machine.createdAt.toISOString(),
    updatedAt: machine.updatedAt.toISOString()
  };
}

function mapMachineEvent(
  event: Awaited<ReturnType<typeof prisma.machineEvent.findFirstOrThrow>> & {
    machine?: { id: string; code: string; name: string; type: string } | null;
    linkedBatch?: { id: string; code: string } | null;
    linkedManufacturingJob?: { id: string; labelCode: string } | null;
    linkedPart?: { id: string; scanCode: string; partCode: string } | null;
  }
) {
  return {
    id: event.id,
    machineId: event.machineId,
    machine: event.machine
      ? {
          id: event.machine.id,
          code: event.machine.code,
          name: event.machine.name,
          type: event.machine.type
        }
      : undefined,
    eventType: event.eventType,
    eventTs: event.eventTs.toISOString(),
    sourceType: event.sourceType,
    sourceEventId: event.sourceEventId ?? undefined,
    payloadJson: event.payloadJson,
    normalizedBatchRef: event.normalizedBatchRef ?? undefined,
    normalizedJobRef: event.normalizedJobRef ?? undefined,
    normalizedPartRef: event.normalizedPartRef ?? undefined,
    sheetRef: event.sheetRef ?? undefined,
    severity: event.severity ?? undefined,
    processingStatus: event.processingStatus,
    linkedBatch: event.linkedBatch
      ? {
          id: event.linkedBatch.id,
          code: event.linkedBatch.code
        }
      : undefined,
    linkedManufacturingJob: event.linkedManufacturingJob
      ? {
          id: event.linkedManufacturingJob.id,
          labelCode: event.linkedManufacturingJob.labelCode
        }
      : undefined,
    linkedPart: event.linkedPart
      ? {
          id: event.linkedPart.id,
          scanCode: event.linkedPart.scanCode,
          partCode: event.linkedPart.partCode
        }
      : undefined,
    notes: event.notes ?? undefined,
    createdAt: event.createdAt.toISOString()
  };
}

export async function listMachines(organizationId: string) {
  const machines = await prisma.machine.findMany({
    where: { organizationId },
    orderBy: [{ type: "asc" }, { code: "asc" }]
  });

  return {
    ok: true as const,
    summary: {
      totalMachines: machines.length,
      activeMachines: machines.filter((machine) => machine.status === "ACTIVE").length,
      cncMachines: machines.filter((machine) => machine.type === "CNC").length,
      edgebanders: machines.filter((machine) => machine.type === "EDGEBANDER").length
    },
    machines: machines.map(mapMachine)
  };
}

export async function createMachine(
  input: {
    code: string;
    name: string;
    type: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
    status?: "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
    locationLabel?: string;
    adapterType?: string;
    notes?: string;
  },
  organizationId: string
) {
  const machine = await prisma.machine.create({
    data: {
      organizationId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      type: input.type,
      status: input.status ?? "ACTIVE",
      locationLabel: input.locationLabel?.trim() || null,
      adapterType: input.adapterType?.trim() || null,
      notes: input.notes?.trim() || null
    }
  });

  return {
    ok: true as const,
    machine: mapMachine(machine)
  };
}

export async function updateMachine(
  machineId: string,
  input: {
    name?: string;
    status?: "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
    locationLabel?: string;
    adapterType?: string;
    notes?: string;
  },
  organizationId: string
) {
  const existing = await prisma.machine.findFirst({
    where: { id: machineId, organizationId }
  });

  if (!existing) {
    throw new Error("Machine not found.");
  }

  const machine = await prisma.machine.update({
    where: { id: machineId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.locationLabel !== undefined ? { locationLabel: input.locationLabel.trim() || null } : {}),
      ...(input.adapterType !== undefined ? { adapterType: input.adapterType.trim() || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
    }
  });

  return {
    ok: true as const,
    machine: mapMachine(machine)
  };
}

export async function getMachineDetail(machineId: string, organizationId: string) {
  const machine = await prisma.machine.findFirst({
    where: { id: machineId, organizationId },
    include: {
      events: {
        include: {
          machine: {
            select: { id: true, code: true, name: true, type: true }
          },
          linkedBatch: {
            select: { id: true, code: true }
          },
          linkedManufacturingJob: {
            select: { id: true, labelCode: true }
          },
          linkedPart: {
            select: { id: true, scanCode: true, partCode: true }
          }
        },
        orderBy: [{ eventTs: "desc" }, { createdAt: "desc" }],
        take: 50
      }
    }
  });

  if (!machine) {
    throw new Error("Machine not found.");
  }

  return {
    ok: true as const,
    machine: mapMachine(machine),
    recentEvents: machine.events.map(mapMachineEvent)
  };
}

export async function listMachineEvents(
  input: {
    machineId?: string;
    eventType?: string;
    processingStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  organizationId: string
) {
  const events = await prisma.machineEvent.findMany({
    where: buildMachineEventWhere({
      organizationId,
      machineId: input.machineId,
      eventType: input.eventType?.trim() || undefined,
      processingStatus: input.processingStatus?.trim() || undefined,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined
    }),
    include: {
      machine: {
        select: { id: true, code: true, name: true, type: true }
      },
      linkedBatch: {
        select: { id: true, code: true }
      },
      linkedManufacturingJob: {
        select: { id: true, labelCode: true }
      },
      linkedPart: {
        select: { id: true, scanCode: true, partCode: true }
      }
    },
    orderBy: [{ eventTs: "desc" }, { createdAt: "desc" }],
    take: 100
  });

  return {
    ok: true as const,
    events: events.map(mapMachineEvent)
  };
}

export async function ingestMachineEvent(
  input: {
    machineId?: string;
    machineCode?: string;
    eventType: string;
    eventTs?: string;
    sourceType: "MANUAL_SIMULATION" | "API" | "FILE_IMPORT" | "PLC_BRIDGE" | "WEBHOOK" | "OTHER";
    sourceEventId?: string;
    payload?: unknown;
    batchRef?: string;
    jobRef?: string;
    partRef?: string;
    scanCode?: string;
    sheetRef?: string;
    severity?: string;
    notes?: string;
  },
  organizationId: string
) {
  const machine = await resolveMachineByIdOrCode({
    organizationId,
    machineId: input.machineId,
    machineCode: input.machineCode?.trim().toUpperCase()
  });

  if (!machine) {
    throw new Error("Machine not found.");
  }

  const normalized = normalizeMachineEventInput({
    eventType: input.eventType as never,
    eventTs: input.eventTs,
    sourceType: input.sourceType,
    sourceEventId: input.sourceEventId,
    payload: input.payload,
    batchRef: input.batchRef,
    jobRef: input.jobRef,
    partRef: input.partRef,
    scanCode: input.scanCode,
    sheetRef: input.sheetRef,
    severity: input.severity,
    notes: input.notes
  });

  const linkResult = await linkMachineEventToContext({
    organizationId,
    normalizedBatchRef: normalized.normalizedBatchRef,
    normalizedJobRef: normalized.normalizedJobRef,
    normalizedPartRef: normalized.normalizedPartRef
  });

  const processingStatus =
    linkResult.processingStatus === "LINKED"
      ? "LINKED"
      : normalized.payloadJson !== undefined
        ? "UNMATCHED"
        : "PARSED";

  const event = await prisma.machineEvent.create({
    data: {
      organizationId,
      machineId: machine.id,
      eventType: normalized.eventType,
      eventTs: normalized.eventTs,
      sourceType: normalized.sourceType,
      sourceEventId: normalized.sourceEventId ?? null,
      payloadJson: normalized.payloadJson as never,
      normalizedBatchRef: normalized.normalizedBatchRef ?? null,
      normalizedJobRef: normalized.normalizedJobRef ?? null,
      normalizedPartRef: normalized.normalizedPartRef ?? null,
      sheetRef: normalized.sheetRef ?? null,
      severity: normalized.severity ?? null,
      processingStatus,
      linkedBatchId: linkResult.linkedBatchId ?? null,
      linkedManufacturingJobId: linkResult.linkedManufacturingJobId ?? null,
      linkedPartId: linkResult.linkedPartId ?? null,
      notes: normalized.notes ?? null
    },
    include: {
      machine: {
        select: { id: true, code: true, name: true, type: true }
      },
      linkedBatch: {
        select: { id: true, code: true }
      },
      linkedManufacturingJob: {
        select: { id: true, labelCode: true }
      },
      linkedPart: {
        select: { id: true, scanCode: true, partCode: true }
      }
    }
  });

  const generatedCandidates = await safeGenerateStageCandidatesForMachineEvent(event.id, organizationId);
  for (const candidate of generatedCandidates) {
    await evaluateTrustedAutoApplyForCandidate(candidate.id, organizationId);
  }

  return {
    ok: true as const,
    event: mapMachineEvent(event),
    linkResult: {
      processingStatus: event.processingStatus,
      linkedBatchId: event.linkedBatchId ?? undefined,
      linkedManufacturingJobId: event.linkedManufacturingJobId ?? undefined,
      linkedPartId: event.linkedPartId ?? undefined
    }
  };
}

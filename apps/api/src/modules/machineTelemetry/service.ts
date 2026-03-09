import { prisma } from "../../lib/prisma.js";
import {
  buildMachineEventHashes
} from "./dedupe.js";
import { linkMachineTelemetryEvent } from "./linker.js";
import { normalizeTelemetryPayload } from "./normalizer.js";
import type {
  MachineEventLinkConfidence,
  MachineSourceType,
  MachineTelemetryEntityType,
  MachineTelemetryEventType
} from "./contracts.js";

const db = prisma as any;

function asIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function safeDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function resolveLocation(input: {
  organizationId: string;
  currentLocationId?: string;
  currentLocationCode?: string;
}) {
  if (!input.currentLocationId && !input.currentLocationCode) {
    return null;
  }

  const where = input.currentLocationId
    ? {
        organizationId: input.organizationId,
        id: input.currentLocationId
      }
    : {
        organizationId: input.organizationId,
        code: input.currentLocationCode
      };

  const location = await db.containerLocation.findFirst({ where });
  if (!location) {
    throw new Error("Machine location not found.");
  }

  return location;
}

async function resolveMachineSource(input: {
  organizationId: string;
  machineSourceId?: string;
  machineSourceCode?: string;
  machineId?: string;
  machineCode?: string;
}) {
  const machineId = input.machineSourceId ?? input.machineId;
  const machineCode = input.machineSourceCode ?? input.machineCode;

  if (!machineId && !machineCode) {
    throw new Error("machineSourceId or machineSourceCode is required.");
  }

  const machine = await db.machine.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(machineId ? [{ id: machineId }] : []),
        ...(machineCode ? [{ code: machineCode.trim().toUpperCase() }] : [])
      ]
    },
    include: {
      currentLocation: true
    }
  });

  if (!machine) {
    throw new Error("Machine source not found.");
  }

  return machine;
}

function mapMachineSource(machine: any) {
  return {
    id: machine.id,
    code: machine.code,
    name: machine.name,
    machineType: machine.type,
    sourceType: machine.sourceType,
    status: machine.status,
    locationId: machine.currentLocationId ?? undefined,
    locationCode: machine.currentLocation?.code ?? undefined,
    locationName: machine.currentLocation?.name ?? machine.locationLabel ?? undefined,
    metadataJson: machine.metadataJson ?? undefined,
    isActive: machine.isActive,
    notes: machine.notes ?? undefined,
    createdAt: machine.createdAt.toISOString(),
    updatedAt: machine.updatedAt.toISOString()
  };
}

function mapIngestRun(run: any) {
  return {
    id: run.id,
    machineSourceId: run.machineSourceId ?? undefined,
    machineSourceCode: run.machineSource?.code ?? undefined,
    ingestType: run.ingestType,
    sourceReference: run.sourceReference ?? undefined,
    rawEnvelopeJson: run.rawEnvelopeJson,
    receivedAt: run.receivedAt.toISOString(),
    processedAt: asIsoString(run.processedAt),
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    eventCount: run.machineEvents?.length ?? undefined
  };
}

function mapMachineEventLink(link: any) {
  return {
    id: link.id,
    machineEventId: link.machineEventId,
    entityType: link.entityType,
    entityId: link.entityId,
    confidence: link.confidence,
    linkMethod: link.linkMethod,
    notes: link.notes ?? undefined,
    createdAt: link.createdAt.toISOString()
  };
}

function mapMachineStageCandidate(candidate: any) {
  return {
    id: candidate.id,
    machineEventId: candidate.machineEventId,
    machineId: candidate.machineId,
    machineCode: candidate.machine?.code ?? undefined,
    machineName: candidate.machine?.name ?? undefined,
    machineType: candidate.machine?.type ?? undefined,
    entityType: candidate.entityType,
    entityId: candidate.entityId,
    suggestedAction: candidate.suggestedAction,
    confidence: candidate.confidence,
    rationale: candidate.rationale,
    status: candidate.status,
    emittedAt: candidate.emittedAt.toISOString(),
    createdAt: candidate.createdAt.toISOString()
  };
}

function mapMachineEvent(event: any) {
  return {
    id: event.id,
    machineSourceId: event.machineId,
    machineSourceCode: event.machine?.code ?? undefined,
    machineSourceName: event.machine?.name ?? undefined,
    machineType: event.machine?.type ?? undefined,
    ingestRunId: event.ingestRunId ?? undefined,
    externalEventId: event.externalEventId ?? event.sourceEventId ?? undefined,
    eventType: event.eventType,
    eventTimestamp: event.eventTs.toISOString(),
    rawEnvelopeJson: event.rawEnvelopeJson ?? undefined,
    rawPayloadJson: event.payloadJson,
    normalizedPayloadJson: event.normalizedPayloadJson ?? undefined,
    normalizedBatchRef: event.normalizedBatchRef ?? undefined,
    normalizedJobRef: event.normalizedJobRef ?? undefined,
    normalizedPartRef: event.normalizedPartRef ?? undefined,
    normalizedRemnantRef: event.normalizedRemnantRef ?? undefined,
    programName: event.programName ?? undefined,
    sheetRef: event.sheetRef ?? undefined,
    severity: event.severity ?? undefined,
    entityType: event.entityType ?? undefined,
    entityId: event.entityId ?? undefined,
    processingStatus: event.processingStatus,
    dedupeKey: event.dedupeKey ?? undefined,
    eventHash: event.eventHash ?? undefined,
    linkedManufacturingBatchId: event.linkedManufacturingBatchId ?? undefined,
    linkedManufacturingPartId: event.linkedManufacturingPartId ?? undefined,
    linkedRemnantId: event.linkedRemnantId ?? undefined,
    notes: event.notes ?? undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    links: event.links?.map(mapMachineEventLink) ?? undefined,
    candidates: event.machineStageCandidates?.map(mapMachineStageCandidate) ?? undefined
  };
}

function buildSignalDrafts(input: {
  machine: { type: string };
  event: { id: string; eventType: string };
  primaryLink: { entityType: MachineTelemetryEntityType; entityId: string; confidence: MachineEventLinkConfidence } | undefined;
}) {
  if (!input.primaryLink || input.primaryLink.confidence !== "HIGH") {
    return [];
  }

  const { machine, event, primaryLink } = input;
  const drafts: Array<{
    entityType: MachineTelemetryEntityType;
    entityId: string;
    suggestedAction: string;
    confidence: MachineEventLinkConfidence;
    rationale: string;
  }> = [];

  if (machine.type === "CNC" && primaryLink.entityType === "MANUFACTURING_BATCH") {
    if (event.eventType === "PROGRAM_STARTED" || event.eventType === "JOB_STARTED") {
      drafts.push({
        entityType: "MANUFACTURING_BATCH",
        entityId: primaryLink.entityId,
        suggestedAction: "MARK_BATCH_CUT_IN_PROGRESS",
        confidence: "HIGH",
        rationale: "CNC machine reported a program/job start for a linked manufacturing batch."
      });
    }

    if (event.eventType === "PROGRAM_COMPLETED" || event.eventType === "JOB_COMPLETED") {
      drafts.push({
        entityType: "MANUFACTURING_BATCH",
        entityId: primaryLink.entityId,
        suggestedAction: "MARK_BATCH_CUT_COMPLETE",
        confidence: "HIGH",
        rationale: "CNC machine reported a program/job completion for a linked manufacturing batch."
      });
    }
  }

  if (machine.type === "CNC" && primaryLink.entityType === "MANUFACTURING_PART" && event.eventType === "PART_CUT") {
    drafts.push({
      entityType: "MANUFACTURING_PART",
      entityId: primaryLink.entityId,
      suggestedAction: "MARK_PART_CUT",
      confidence: "HIGH",
      rationale: "CNC machine reported a direct part-cut event for a linked manufacturing part."
    });
  }

  if (machine.type === "EDGEBANDER" && primaryLink.entityType === "MANUFACTURING_PART" && event.eventType === "JOB_COMPLETED") {
    drafts.push({
      entityType: "MANUFACTURING_PART",
      entityId: primaryLink.entityId,
      suggestedAction: "MARK_PART_EDGEBANDED",
      confidence: "HIGH",
      rationale: "Edgebander reported a completed job event for a linked manufacturing part."
    });
  }

  return drafts;
}

async function emitMachineStageCandidates(input: {
  organizationId: string;
  machine: any;
  machineEvent: any;
  primaryLink?: { entityType: MachineTelemetryEntityType; entityId: string; confidence: MachineEventLinkConfidence };
}) {
  const drafts = buildSignalDrafts({
    machine: input.machine,
    event: input.machineEvent,
    primaryLink: input.primaryLink
  });

  const created = [];
  for (const draft of drafts) {
    const existing = await db.machineStageCandidate.findFirst({
      where: {
        organizationId: input.organizationId,
        machineEventId: input.machineEvent.id,
        entityType: draft.entityType,
        entityId: draft.entityId,
        suggestedAction: draft.suggestedAction
      },
      include: {
        machine: true
      }
    });

    if (existing) {
      created.push(existing);
      continue;
    }

    const candidate = await db.machineStageCandidate.create({
      data: {
        organizationId: input.organizationId,
        machineEventId: input.machineEvent.id,
        machineId: input.machine.id,
        entityType: draft.entityType,
        entityId: draft.entityId,
        suggestedAction: draft.suggestedAction,
        confidence: draft.confidence,
        rationale: draft.rationale,
        status: "NEW"
      },
      include: {
        machine: true
      }
    });

    created.push(candidate);
  }

  if (created.length > 0) {
    await db.machineEvent.update({
      where: { id: input.machineEvent.id },
      data: {
        processingStatus: "SIGNAL_EMITTED"
      }
    });
  }

  return created.map(mapMachineStageCandidate);
}

async function processTelemetryEvent(input: {
  organizationId: string;
  machine: any;
  ingestRunId: string;
  ingestPayload: {
    externalEventId?: string;
    eventType: MachineTelemetryEventType;
    eventTimestamp?: string;
    sourceType: string;
    payload?: unknown;
    batchRef?: string;
    jobRef?: string;
    partRef?: string;
    remnantCode?: string;
    sheetRef?: string;
    severity?: string;
    notes?: string;
  };
  rawEnvelopeJson: unknown;
}) {
  try {
    const normalized = normalizeTelemetryPayload(input.ingestPayload as any);
    const hashes = buildMachineEventHashes({
      organizationId: input.organizationId,
      machineSourceId: input.machine.id,
      externalEventId: normalized.externalEventId,
      eventType: normalized.eventType,
      eventTimestamp: normalized.eventTimestamp,
      batchRef: normalized.normalizedBatchRef,
      partRef: normalized.normalizedPartRef,
      remnantRef: normalized.normalizedRemnantRef,
      programName: normalized.programName
    });

    const duplicate = await db.machineEvent.findFirst({
      where: {
        organizationId: input.organizationId,
        OR: [
          ...(hashes.dedupeKey ? [{ dedupeKey: hashes.dedupeKey }] : []),
          ...(hashes.eventHash ? [{ eventHash: hashes.eventHash }] : [])
        ]
      }
    });

    const linkResult = await linkMachineTelemetryEvent({
      organizationId: input.organizationId,
      normalizedBatchRef: normalized.normalizedBatchRef,
      normalizedPartRef: normalized.normalizedPartRef,
      normalizedRemnantRef: normalized.normalizedRemnantRef,
      programName: normalized.programName
    });

    const event = await db.machineEvent.create({
      data: {
        organizationId: input.organizationId,
        machineId: input.machine.id,
        ingestRunId: input.ingestRunId,
        eventType: normalized.eventType,
        eventTs: normalized.eventTimestamp,
        sourceType: normalized.sourceType,
        sourceEventId: normalized.externalEventId ?? null,
        externalEventId: normalized.externalEventId ?? null,
        rawEnvelopeJson: input.rawEnvelopeJson,
        payloadJson: normalized.rawPayloadJson,
        normalizedPayloadJson: normalized.normalizedPayloadJson,
        normalizedBatchRef: normalized.normalizedBatchRef ?? null,
        normalizedJobRef: normalized.normalizedJobRef ?? null,
        normalizedPartRef: normalized.normalizedPartRef ?? null,
        normalizedRemnantRef: normalized.normalizedRemnantRef ?? null,
        sheetRef: normalized.sheetRef ?? null,
        programName: normalized.programName ?? null,
        operatorName: normalized.operatorName ?? null,
        machineState: normalized.machineState ?? null,
        entityType: linkResult.primaryLink?.entityType ?? null,
        entityId: linkResult.primaryLink?.entityId ?? null,
        eventHash: hashes.eventHash,
        dedupeKey: hashes.dedupeKey,
        severity: normalized.severity ?? null,
        processingStatus: duplicate ? "DUPLICATE" : linkResult.processingStatus,
        linkedManufacturingBatchId:
          linkResult.links.find((link) => link.entityType === "MANUFACTURING_BATCH")?.entityId ?? null,
        linkedManufacturingPartId:
          linkResult.links.find((link) => link.entityType === "MANUFACTURING_PART")?.entityId ?? null,
        linkedRemnantId: linkResult.links.find((link) => link.entityType === "REMNANT")?.entityId ?? null,
        notes: normalized.notes ?? null
      },
      include: {
        machine: true
      }
    });

    if (linkResult.links.length > 0) {
      await db.machineEventLink.createMany({
        data: linkResult.links.map((link) => ({
          organizationId: input.organizationId,
          machineId: input.machine.id,
          machineEventId: event.id,
          entityType: link.entityType,
          entityId: link.entityId,
          confidence: link.confidence,
          linkMethod: link.linkMethod,
          notes: link.notes ?? null
        }))
      });
    }

    const emittedCandidates =
      duplicate || !linkResult.primaryLink || linkResult.primaryLink.confidence !== "HIGH"
        ? []
        : await emitMachineStageCandidates({
            organizationId: input.organizationId,
            machine: input.machine,
            machineEvent: event,
            primaryLink: linkResult.primaryLink
          });

    const hydrated = await db.machineEvent.findFirst({
      where: { id: event.id },
      include: {
        machine: true,
        links: true,
        machineStageCandidates: {
          include: { machine: true }
        }
      }
    });

    return {
      ok: true as const,
      event: mapMachineEvent(hydrated),
      ingestStatus: duplicate ? "DUPLICATE" : "PROCESSED",
      linkResult: {
        processingStatus: duplicate ? "DUPLICATE" : linkResult.processingStatus,
        primaryLink: linkResult.primaryLink,
        links: linkResult.links
      },
      emittedCandidates,
      duplicateOfEventId: duplicate?.id ?? undefined
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Machine event processing failed.";
    const failedEvent = await db.machineEvent.create({
      data: {
        organizationId: input.organizationId,
        machineId: input.machine.id,
        ingestRunId: input.ingestRunId,
        eventType: input.ingestPayload.eventType ?? "UNKNOWN",
        eventTs: safeDate(input.ingestPayload.eventTimestamp),
        sourceType: input.ingestPayload.sourceType,
        sourceEventId: input.ingestPayload.externalEventId ?? null,
        externalEventId: input.ingestPayload.externalEventId ?? null,
        rawEnvelopeJson: input.rawEnvelopeJson,
        payloadJson: asObject(input.ingestPayload.payload),
        processingStatus: "FAILED",
        notes: message
      },
      include: {
        machine: true,
        links: true,
        machineStageCandidates: {
          include: { machine: true }
        }
      }
    });

    return {
      ok: false as const,
      event: mapMachineEvent(failedEvent),
      error: message,
      ingestStatus: "FAILED" as const,
      linkResult: {
        processingStatus: "FAILED",
        primaryLink: undefined,
        links: []
      },
      emittedCandidates: []
    };
  }
}

export async function listMachineSources(organizationId: string) {
  const machines = await db.machine.findMany({
    where: { organizationId },
    include: { currentLocation: true },
    orderBy: [{ type: "asc" }, { code: "asc" }]
  });

  return {
    ok: true as const,
    sources: machines.map(mapMachineSource)
  };
}

export async function getMachineSource(machineId: string, organizationId: string) {
  const machine = await db.machine.findFirst({
    where: { id: machineId, organizationId },
    include: {
      currentLocation: true
    }
  });

  if (!machine) {
    throw new Error("Machine source not found.");
  }

  return {
    ok: true as const,
    source: mapMachineSource(machine)
  };
}

export async function createMachineSource(
  input: {
    code: string;
    name: string;
    machineType: string;
    sourceType: MachineSourceType;
    status?: string;
    currentLocationId?: string;
    currentLocationCode?: string;
    locationLabel?: string;
    adapterType?: string;
    metadataJson?: unknown;
    isActive?: boolean;
    notes?: string;
  },
  organizationId: string
) {
  const location = await resolveLocation({
    organizationId,
    currentLocationId: input.currentLocationId,
    currentLocationCode: input.currentLocationCode
  });

  const machine = await db.machine.create({
    data: {
      organizationId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      type: input.machineType,
      sourceType: input.sourceType,
      status: input.status ?? "ACTIVE",
      currentLocationId: location?.id ?? null,
      locationLabel: input.locationLabel?.trim() || location?.name || null,
      adapterType: input.adapterType?.trim() || null,
      metadataJson: input.metadataJson ?? {},
      isActive: input.isActive ?? true,
      notes: input.notes?.trim() || null
    },
    include: {
      currentLocation: true
    }
  });

  return {
    ok: true as const,
    source: mapMachineSource(machine)
  };
}

export async function updateMachineSource(
  machineId: string,
  input: {
    name?: string;
    machineType?: string;
    sourceType?: MachineSourceType;
    status?: string;
    currentLocationId?: string | null;
    currentLocationCode?: string;
    locationLabel?: string;
    adapterType?: string;
    metadataJson?: unknown;
    isActive?: boolean;
    notes?: string;
  },
  organizationId: string
) {
  const existing = await db.machine.findFirst({
    where: { id: machineId, organizationId },
    include: { currentLocation: true }
  });

  if (!existing) {
    throw new Error("Machine source not found.");
  }

  const location =
    input.currentLocationId === null
      ? null
      : await resolveLocation({
          organizationId,
          currentLocationId: input.currentLocationId ?? undefined,
          currentLocationCode: input.currentLocationCode
        });

  const machine = await db.machine.update({
    where: { id: machineId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.machineType !== undefined ? { type: input.machineType } : {}),
      ...(input.sourceType !== undefined ? { sourceType: input.sourceType } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.currentLocationId !== undefined || input.currentLocationCode !== undefined
        ? {
            currentLocationId: location?.id ?? null,
            locationLabel: input.locationLabel?.trim() || location?.name || null
          }
        : {}),
      ...(input.locationLabel !== undefined && input.currentLocationId === undefined && input.currentLocationCode === undefined
        ? { locationLabel: input.locationLabel.trim() || null }
        : {}),
      ...(input.adapterType !== undefined ? { adapterType: input.adapterType.trim() || null } : {}),
      ...(input.metadataJson !== undefined ? { metadataJson: input.metadataJson } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
    },
    include: {
      currentLocation: true
    }
  });

  return {
    ok: true as const,
    source: mapMachineSource(machine)
  };
}

export async function ingestMachineEvent(
  input: {
    machineSourceId?: string;
    machineSourceCode?: string;
    machineId?: string;
    machineCode?: string;
    externalEventId?: string;
    eventType: MachineTelemetryEventType;
    eventTimestamp?: string;
    sourceType: string;
    payload?: unknown;
    batchRef?: string;
    jobRef?: string;
    partRef?: string;
    remnantCode?: string;
    sheetRef?: string;
    severity?: string;
    notes?: string;
  },
  organizationId: string
) {
  const machine = await resolveMachineSource({ ...input, organizationId });
  const ingestRun = await db.machineEventIngestRun.create({
    data: {
      organizationId,
      machineSourceId: machine.id,
      ingestType: "SINGLE_EVENT",
      sourceReference: input.externalEventId ?? null,
      rawEnvelopeJson: input
    },
    include: {
      machineSource: true,
      machineEvents: true
    }
  });

  const result = await processTelemetryEvent({
    organizationId,
    machine,
    ingestRunId: ingestRun.id,
    ingestPayload: input,
    rawEnvelopeJson: input
  });

  await db.machineEventIngestRun.update({
    where: { id: ingestRun.id },
    data: {
      processedAt: new Date(),
      status: result.ok ? "PROCESSED" : "FAILED"
    }
  });

  return {
    ok: result.ok,
    ingestRun: mapIngestRun({
      ...ingestRun,
      processedAt: new Date(),
      status: result.ok ? "PROCESSED" : "FAILED"
    }),
    event: result.event,
    linkResult: result.linkResult,
    emittedCandidates: result.emittedCandidates,
    error: result.ok ? undefined : result.error,
    duplicateOfEventId: result.duplicateOfEventId
  };
}

export async function ingestMachineEventBatch(
  input: {
    machineSourceId?: string;
    machineSourceCode?: string;
    machineId?: string;
    machineCode?: string;
    sourceReference?: string;
    events: Array<{
      externalEventId?: string;
      eventType: MachineTelemetryEventType;
      eventTimestamp?: string;
      sourceType: string;
      payload?: unknown;
      batchRef?: string;
      jobRef?: string;
      partRef?: string;
      remnantCode?: string;
      sheetRef?: string;
      severity?: string;
      notes?: string;
    }>;
  },
  organizationId: string
) {
  const machine = await resolveMachineSource({ ...input, organizationId });
  const ingestRun = await db.machineEventIngestRun.create({
    data: {
      organizationId,
      machineSourceId: machine.id,
      ingestType: "EVENT_BATCH",
      sourceReference: input.sourceReference ?? null,
      rawEnvelopeJson: input
    }
  });

  const results = [];
  let failedCount = 0;

  for (const event of input.events) {
    const result = await processTelemetryEvent({
      organizationId,
      machine,
      ingestRunId: ingestRun.id,
      ingestPayload: event,
      rawEnvelopeJson: event
    });

    if (!result.ok) {
      failedCount += 1;
    }

    results.push(result);
  }

  const status =
    failedCount === input.events.length ? "FAILED" : failedCount > 0 ? "PARTIAL" : "PROCESSED";

  const updatedRun = await db.machineEventIngestRun.update({
    where: { id: ingestRun.id },
    data: {
      processedAt: new Date(),
      status
    },
    include: {
      machineSource: true,
      machineEvents: true
    }
  });

  return {
    ok: status !== "FAILED",
    ingestRun: mapIngestRun(updatedRun),
    events: results.map((result) => ({
      ok: result.ok,
      event: result.event,
      linkResult: result.linkResult,
      emittedCandidates: result.emittedCandidates,
      error: result.ok ? undefined : result.error,
      duplicateOfEventId: result.duplicateOfEventId
    }))
  };
}

export async function listMachineEvents(
  input: {
    machineSourceId?: string;
    eventType?: string;
    processingStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  organizationId: string
) {
  const events = await db.machineEvent.findMany({
    where: {
      organizationId,
      ...(input.machineSourceId ? { machineId: input.machineSourceId } : {}),
      ...(input.eventType ? { eventType: input.eventType } : {}),
      ...(input.processingStatus ? { processingStatus: input.processingStatus } : {}),
      ...((input.dateFrom || input.dateTo) && {
        eventTs: {
          ...(input.dateFrom ? { gte: new Date(input.dateFrom) } : {}),
          ...(input.dateTo ? { lte: new Date(input.dateTo) } : {})
        }
      })
    },
    include: {
      machine: true,
      links: true,
      machineStageCandidates: {
        include: { machine: true }
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

export async function getMachineEvent(eventId: string, organizationId: string) {
  const event = await db.machineEvent.findFirst({
    where: { id: eventId, organizationId },
    include: {
      machine: true,
      links: true,
      machineStageCandidates: {
        include: { machine: true }
      }
    }
  });

  if (!event) {
    throw new Error("Machine event not found.");
  }

  return {
    ok: true as const,
    event: mapMachineEvent(event)
  };
}

export async function getMachineEventLinks(eventId: string, organizationId: string) {
  const event = await db.machineEvent.findFirst({
    where: { id: eventId, organizationId }
  });

  if (!event) {
    throw new Error("Machine event not found.");
  }

  const links = await db.machineEventLink.findMany({
    where: {
      organizationId,
      machineEventId: eventId
    },
    orderBy: [{ createdAt: "asc" }]
  });

  return {
    ok: true as const,
    eventId,
    links: links.map(mapMachineEventLink)
  };
}

export async function listMachineEventIngestRuns(organizationId: string) {
  const runs = await db.machineEventIngestRun.findMany({
    where: { organizationId },
    include: {
      machineSource: true,
      machineEvents: true
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100
  });

  return {
    ok: true as const,
    ingestRuns: runs.map(mapIngestRun)
  };
}

export async function getMachineEventIngestRun(runId: string, organizationId: string) {
  const run = await db.machineEventIngestRun.findFirst({
    where: { id: runId, organizationId },
    include: {
      machineSource: true,
      machineEvents: {
        include: {
          machine: true,
          links: true,
          machineStageCandidates: {
            include: { machine: true }
          }
        },
        orderBy: [{ createdAt: "asc" }]
      }
    }
  });

  if (!run) {
    throw new Error("Machine event ingest run not found.");
  }

  return {
    ok: true as const,
    ingestRun: {
      ...mapIngestRun(run),
      events: run.machineEvents.map(mapMachineEvent)
    }
  };
}

export async function reprocessMachineEvent(eventId: string, organizationId: string) {
  const existing = await db.machineEvent.findFirst({
    where: { id: eventId, organizationId },
    include: {
      machine: true
    }
  });

  if (!existing) {
    throw new Error("Machine event not found.");
  }

  if (existing.processingStatus === "DUPLICATE") {
    return getMachineEvent(eventId, organizationId);
  }

  const normalized = normalizeTelemetryPayload({
    eventType: existing.eventType,
    eventTimestamp: existing.eventTs,
    sourceType: existing.sourceType,
    externalEventId: existing.externalEventId ?? existing.sourceEventId ?? undefined,
    payload: existing.payloadJson,
    batchRef: existing.normalizedBatchRef ?? undefined,
    jobRef: existing.normalizedJobRef ?? undefined,
    partRef: existing.normalizedPartRef ?? undefined,
    remnantCode: existing.normalizedRemnantRef ?? undefined,
    sheetRef: existing.sheetRef ?? undefined,
    severity: existing.severity ?? undefined,
    notes: existing.notes ?? undefined
  } as any);

  const linkResult = await linkMachineTelemetryEvent({
    organizationId,
    normalizedBatchRef: normalized.normalizedBatchRef,
    normalizedPartRef: normalized.normalizedPartRef,
    normalizedRemnantRef: normalized.normalizedRemnantRef,
    programName: normalized.programName
  });

  await db.machineEventLink.deleteMany({
    where: {
      organizationId,
      machineEventId: eventId
    }
  });

  if (linkResult.links.length > 0) {
    await db.machineEventLink.createMany({
      data: linkResult.links.map((link) => ({
        organizationId,
        machineId: existing.machineId,
        machineEventId: eventId,
        entityType: link.entityType,
        entityId: link.entityId,
        confidence: link.confidence,
        linkMethod: link.linkMethod,
        notes: link.notes ?? null
      }))
    });
  }

  await db.machineEvent.update({
    where: { id: eventId },
    data: {
      normalizedPayloadJson: normalized.normalizedPayloadJson,
      normalizedBatchRef: normalized.normalizedBatchRef ?? null,
      normalizedJobRef: normalized.normalizedJobRef ?? null,
      normalizedPartRef: normalized.normalizedPartRef ?? null,
      normalizedRemnantRef: normalized.normalizedRemnantRef ?? null,
      programName: normalized.programName ?? null,
      entityType: linkResult.primaryLink?.entityType ?? null,
      entityId: linkResult.primaryLink?.entityId ?? null,
      processingStatus: linkResult.processingStatus,
      linkedManufacturingBatchId:
        linkResult.links.find((link) => link.entityType === "MANUFACTURING_BATCH")?.entityId ?? null,
      linkedManufacturingPartId:
        linkResult.links.find((link) => link.entityType === "MANUFACTURING_PART")?.entityId ?? null,
      linkedRemnantId: linkResult.links.find((link) => link.entityType === "REMNANT")?.entityId ?? null,
      notes: normalized.notes ?? null
    }
  });

  if (linkResult.primaryLink?.confidence === "HIGH") {
    await emitMachineStageCandidates({
      organizationId,
      machine: existing.machine,
      machineEvent: existing,
      primaryLink: linkResult.primaryLink
    });
  }

  return getMachineEvent(eventId, organizationId);
}

export async function listMachineStageCandidates(
  input: {
    status?: string;
    entityType?: string;
    machineSourceId?: string;
  },
  organizationId: string
) {
  const candidates = await db.machineStageCandidate.findMany({
    where: {
      organizationId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.machineSourceId ? { machineId: input.machineSourceId } : {})
    },
    include: {
      machine: true
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    ok: true as const,
    candidates: candidates.map(mapMachineStageCandidate)
  };
}

export async function getMachineStageCandidate(candidateId: string, organizationId: string) {
  const candidate = await db.machineStageCandidate.findFirst({
    where: {
      id: candidateId,
      organizationId
    },
    include: {
      machine: true
    }
  });

  if (!candidate) {
    throw new Error("Machine stage candidate not found.");
  }

  return {
    ok: true as const,
    candidate: mapMachineStageCandidate(candidate)
  };
}

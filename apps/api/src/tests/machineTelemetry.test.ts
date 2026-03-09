import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  containerLocation: {
    findFirst: vi.fn()
  },
  machine: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  machineEventIngestRun: {
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  machineEvent: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  machineEventLink: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn()
  },
  machineStageCandidate: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn()
  },
  manufacturingBatch: {
    findFirst: vi.fn()
  },
  manufacturingPart: {
    findFirst: vi.fn()
  },
  remnant: {
    findFirst: vi.fn()
  }
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));

import {
  createMachineSource,
  ingestMachineEvent,
  ingestMachineEventBatch,
  listMachineSources,
  updateMachineSource
} from "../modules/machineTelemetry/service.js";
import { linkMachineTelemetryEvent } from "../modules/machineTelemetry/linker.js";
import { normalizeTelemetryPayload } from "../modules/machineTelemetry/normalizer.js";

function machineSourceRecord() {
  return {
    id: "machine_1",
    organizationId: "org_local_craft_board",
    code: "CNC-PRIMARY",
    name: "Primary CNC Router",
    type: "CNC",
    sourceType: "LOCAL_AGENT",
    status: "ACTIVE",
    currentLocationId: null,
    currentLocation: null,
    locationLabel: "CNC Outfeed",
    adapterType: "generic-cnc-agent",
    metadataJson: { starter: true },
    isActive: true,
    notes: null,
    createdAt: new Date("2026-03-08T00:00:00.000Z"),
    updatedAt: new Date("2026-03-08T00:00:00.000Z")
  };
}

describe("machine telemetry service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates, lists, and updates machine sources", async () => {
    prismaMock.machine.create.mockResolvedValue(machineSourceRecord());
    prismaMock.machine.findMany.mockResolvedValue([machineSourceRecord()]);
    prismaMock.machine.findFirst.mockResolvedValue(machineSourceRecord());
    prismaMock.machine.update.mockResolvedValue({
      ...machineSourceRecord(),
      name: "Updated CNC Router",
      status: "HOLD",
      updatedAt: new Date("2026-03-08T01:00:00.000Z")
    });

    const created = await createMachineSource(
      {
        code: "cnc-primary",
        name: "Primary CNC Router",
        machineType: "CNC",
        sourceType: "LOCAL_AGENT"
      },
      "org_local_craft_board"
    );
    const listed = await listMachineSources("org_local_craft_board");
    const updated = await updateMachineSource(
      "machine_1",
      {
        name: "Updated CNC Router",
        status: "HOLD"
      },
      "org_local_craft_board"
    );

    expect(created.source.code).toBe("CNC-PRIMARY");
    expect(listed.sources).toHaveLength(1);
    expect(updated.source.status).toBe("HOLD");
  });

  it("normalizes telemetry payloads into stable canonical fields", () => {
    const normalized = normalizeTelemetryPayload({
      eventType: "RUN_COMPLETED",
      eventTimestamp: "2026-03-08T10:00:00.000Z",
      sourceType: "API",
      payload: {
        batchNumber: "CUT-20260308-001",
        partNumber: "PART:MP-20260308-001-P0001",
        remnantCode: "REMNANT:REM-0001",
        programName: "CUT-20260308-001"
      }
    });

    expect(normalized.eventType).toBe("PROGRAM_COMPLETED");
    expect(normalized.normalizedBatchRef).toBe("CUT-20260308-001");
    expect(normalized.normalizedPartRef).toBe("MP-20260308-001-P0001");
    expect(normalized.normalizedRemnantRef).toBe("REM-0001");
  });

  it("links events conservatively to manufacturing batch, part, and remnant context", async () => {
    prismaMock.manufacturingBatch.findFirst.mockResolvedValueOnce({ id: "mb_1" });
    prismaMock.manufacturingPart.findFirst.mockResolvedValueOnce({ id: "mp_1" });
    prismaMock.remnant.findFirst.mockResolvedValueOnce({ id: "rem_1" });

    const result = await linkMachineTelemetryEvent({
      organizationId: "org_local_craft_board",
      normalizedBatchRef: "CUT-20260308-001",
      normalizedPartRef: "MP-20260308-001-P0001",
      normalizedRemnantRef: "REM-0001"
    });

    expect(result.processingStatus).toBe("LINKED");
    expect(result.links.map((link) => link.entityType)).toEqual([
      "MANUFACTURING_BATCH",
      "MANUFACTURING_PART",
      "REMNANT"
    ]);
    expect(result.primaryLink?.confidence).toBe("HIGH");
  });

  it("ingests a single event, preserves raw payload, links to a batch, and emits a candidate", async () => {
    const machine = machineSourceRecord();

    prismaMock.machine.findFirst.mockResolvedValue(machine);
    prismaMock.machineEventIngestRun.create.mockResolvedValue({
      id: "run_1",
      machineSourceId: "machine_1",
      machineSource: machine,
      machineEvents: [],
      ingestType: "SINGLE_EVENT",
      sourceReference: null,
      rawEnvelopeJson: {},
      receivedAt: new Date("2026-03-08T10:00:00.000Z"),
      processedAt: null,
      status: "RECEIVED",
      createdAt: new Date("2026-03-08T10:00:00.000Z")
    });
    prismaMock.machineEvent.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "evt_1",
        machineId: "machine_1",
        machine,
        ingestRunId: "run_1",
        externalEventId: "external-1",
        sourceEventId: "external-1",
        eventType: "PROGRAM_COMPLETED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        rawEnvelopeJson: {
          machineSourceCode: "CNC-PRIMARY",
          payload: { batchNumber: "CUT-20260308-001" }
        },
        payloadJson: { batchNumber: "CUT-20260308-001" },
        normalizedPayloadJson: { batchNumber: "CUT-20260308-001" },
        normalizedBatchRef: "CUT-20260308-001",
        normalizedJobRef: null,
        normalizedPartRef: null,
        normalizedRemnantRef: null,
        programName: "CUT-20260308-001",
        sheetRef: null,
        severity: null,
        entityType: "MANUFACTURING_BATCH",
        entityId: "mb_1",
        eventHash: "hash_1",
        dedupeKey: "machine_1:external-1:PROGRAM_COMPLETED",
        processingStatus: "SIGNAL_EMITTED",
        linkedManufacturingBatchId: "mb_1",
        linkedManufacturingPartId: null,
        linkedRemnantId: null,
        notes: null,
        createdAt: new Date("2026-03-08T10:00:00.000Z"),
        updatedAt: new Date("2026-03-08T10:00:00.000Z"),
        links: [
          {
            id: "link_1",
            machineEventId: "evt_1",
            entityType: "MANUFACTURING_BATCH",
            entityId: "mb_1",
            confidence: "HIGH",
            linkMethod: "BATCH_NUMBER_MATCH",
            notes: null,
            createdAt: new Date("2026-03-08T10:00:00.000Z")
          }
        ],
        machineStageCandidates: [
          {
            id: "cand_1",
            machineEventId: "evt_1",
            machineId: "machine_1",
            machine,
            entityType: "MANUFACTURING_BATCH",
            entityId: "mb_1",
            suggestedAction: "MARK_BATCH_CUT_COMPLETE",
            confidence: "HIGH",
            rationale: "CNC machine reported a program/job completion for a linked manufacturing batch.",
            status: "NEW",
            emittedAt: new Date("2026-03-08T10:00:00.000Z"),
            createdAt: new Date("2026-03-08T10:00:00.000Z")
          }
        ]
      });
    prismaMock.machineEvent.create.mockResolvedValue({
      id: "evt_1",
      machineId: "machine_1",
      eventType: "PROGRAM_COMPLETED",
      eventTs: new Date("2026-03-08T10:00:00.000Z"),
      machine
    });
    prismaMock.manufacturingBatch.findFirst.mockResolvedValue({ id: "mb_1" });
    prismaMock.machineEventLink.createMany.mockResolvedValue({ count: 1 });
    prismaMock.machineStageCandidate.findFirst.mockResolvedValue(null);
    prismaMock.machineStageCandidate.create.mockResolvedValue({
      id: "cand_1",
      machineEventId: "evt_1",
      machineId: "machine_1",
      machine,
      entityType: "MANUFACTURING_BATCH",
      entityId: "mb_1",
      suggestedAction: "MARK_BATCH_CUT_COMPLETE",
      confidence: "HIGH",
      rationale: "CNC machine reported a program/job completion for a linked manufacturing batch.",
      status: "NEW",
      emittedAt: new Date("2026-03-08T10:00:00.000Z"),
      createdAt: new Date("2026-03-08T10:00:00.000Z")
    });
    prismaMock.machineEvent.update.mockResolvedValue({});
    prismaMock.machineEventIngestRun.update.mockResolvedValue({});

    const result = await ingestMachineEvent(
      {
        machineSourceCode: "CNC-PRIMARY",
        externalEventId: "external-1",
        eventType: "PROGRAM_COMPLETED",
        eventTimestamp: "2026-03-08T10:00:00.000Z",
        sourceType: "API",
        payload: {
          batchNumber: "CUT-20260308-001",
          programName: "CUT-20260308-001"
        }
      },
      "org_local_craft_board"
    );

    expect(result.ok).toBe(true);
    expect(result.event.rawPayloadJson).toEqual({ batchNumber: "CUT-20260308-001" });
    expect(result.event.rawEnvelopeJson).toEqual({
      machineSourceCode: "CNC-PRIMARY",
      payload: { batchNumber: "CUT-20260308-001" }
    });
    expect(result.event.processingStatus).toBe("SIGNAL_EMITTED");
    expect(result.linkResult.primaryLink?.entityType).toBe("MANUFACTURING_BATCH");
    expect(result.emittedCandidates).toHaveLength(1);
  });

  it("marks duplicate events and does not emit another signal", async () => {
    const machine = machineSourceRecord();

    prismaMock.machine.findFirst.mockResolvedValue(machine);
    prismaMock.machineEventIngestRun.create.mockResolvedValue({
      id: "run_2",
      machineSourceId: "machine_1",
      machineSource: machine,
      machineEvents: [],
      ingestType: "SINGLE_EVENT",
      sourceReference: null,
      rawEnvelopeJson: {},
      receivedAt: new Date("2026-03-08T10:00:00.000Z"),
      processedAt: null,
      status: "RECEIVED",
      createdAt: new Date("2026-03-08T10:00:00.000Z")
    });
    prismaMock.machineEvent.findFirst
      .mockResolvedValueOnce({ id: "evt_original" })
      .mockResolvedValueOnce({
        id: "evt_duplicate",
        machineId: "machine_1",
        machine,
        ingestRunId: "run_2",
        externalEventId: "dup-1",
        sourceEventId: "dup-1",
        eventType: "PART_CUT",
        eventTs: new Date("2026-03-08T10:05:00.000Z"),
        rawEnvelopeJson: {},
        payloadJson: { partNumber: "MP-20260308-001-P0001" },
        normalizedPayloadJson: { partNumber: "MP-20260308-001-P0001" },
        normalizedBatchRef: null,
        normalizedJobRef: null,
        normalizedPartRef: "MP-20260308-001-P0001",
        normalizedRemnantRef: null,
        programName: null,
        sheetRef: null,
        severity: null,
        entityType: "MANUFACTURING_PART",
        entityId: "mp_1",
        eventHash: "hash_dup",
        dedupeKey: "machine_1:dup-1:PART_CUT",
        processingStatus: "DUPLICATE",
        linkedManufacturingBatchId: null,
        linkedManufacturingPartId: "mp_1",
        linkedRemnantId: null,
        notes: null,
        createdAt: new Date("2026-03-08T10:05:00.000Z"),
        updatedAt: new Date("2026-03-08T10:05:00.000Z"),
        links: [],
        machineStageCandidates: []
      });
    prismaMock.machineEvent.create.mockResolvedValue({
      id: "evt_duplicate",
      machineId: "machine_1",
      eventType: "PART_CUT",
      eventTs: new Date("2026-03-08T10:05:00.000Z"),
      machine
    });
    prismaMock.manufacturingPart.findFirst.mockResolvedValue({ id: "mp_1" });
    prismaMock.machineEventLink.createMany.mockResolvedValue({ count: 1 });
    prismaMock.machineEventIngestRun.update.mockResolvedValue({});

    const result = await ingestMachineEvent(
      {
        machineSourceCode: "CNC-PRIMARY",
        externalEventId: "dup-1",
        eventType: "PART_CUT",
        eventTimestamp: "2026-03-08T10:05:00.000Z",
        sourceType: "API",
        payload: {
          partNumber: "MP-20260308-001-P0001"
        }
      },
      "org_local_craft_board"
    );

    expect(result.ok).toBe(true);
    expect(result.linkResult.processingStatus).toBe("DUPLICATE");
    expect(result.duplicateOfEventId).toBe("evt_original");
    expect(prismaMock.machineStageCandidate.create).not.toHaveBeenCalled();
  });

  it("stores unresolved events safely and supports partial batch ingestion", async () => {
    const machine = machineSourceRecord();

    prismaMock.machine.findFirst.mockResolvedValue(machine);
    prismaMock.machineEventIngestRun.create.mockResolvedValue({
      id: "run_batch_1",
      machineSourceId: "machine_1",
      machineSource: machine,
      machineEvents: [],
      ingestType: "EVENT_BATCH",
      sourceReference: null,
      rawEnvelopeJson: {},
      receivedAt: new Date("2026-03-08T10:10:00.000Z"),
      processedAt: null,
      status: "RECEIVED",
      createdAt: new Date("2026-03-08T10:10:00.000Z")
    });
    prismaMock.machineEvent.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "evt_unmatched",
        machineId: "machine_1",
        machine,
        ingestRunId: "run_batch_1",
        externalEventId: "evt-a",
        sourceEventId: "evt-a",
        eventType: "HEARTBEAT",
        eventTs: new Date("2026-03-08T10:10:00.000Z"),
        rawEnvelopeJson: {},
        payloadJson: { machineState: "RUNNING" },
        normalizedPayloadJson: { machineState: "RUNNING" },
        normalizedBatchRef: null,
        normalizedJobRef: null,
        normalizedPartRef: null,
        normalizedRemnantRef: null,
        programName: null,
        sheetRef: null,
        severity: null,
        entityType: null,
        entityId: null,
        eventHash: "hash_unmatched",
        dedupeKey: "hash_unmatched",
        processingStatus: "NORMALIZED",
        linkedManufacturingBatchId: null,
        linkedManufacturingPartId: null,
        linkedRemnantId: null,
        notes: null,
        createdAt: new Date("2026-03-08T10:10:00.000Z"),
        updatedAt: new Date("2026-03-08T10:10:00.000Z"),
        links: [],
        machineStageCandidates: []
      });
    prismaMock.machineEvent.create
      .mockResolvedValueOnce({
        id: "evt_unmatched",
        machineId: "machine_1",
        eventType: "HEARTBEAT",
        eventTs: new Date("2026-03-08T10:10:00.000Z"),
        machine
      })
      .mockResolvedValueOnce({
        id: "evt_failed",
        machineId: "machine_1",
        eventType: "PROGRAM_STARTED",
        eventTs: new Date("2026-03-08T10:11:00.000Z"),
        machine,
        rawEnvelopeJson: {},
        payloadJson: {},
        processingStatus: "FAILED",
        createdAt: new Date("2026-03-08T10:11:00.000Z"),
        updatedAt: new Date("2026-03-08T10:11:00.000Z"),
        links: [],
        machineStageCandidates: []
      });
    prismaMock.machineEventLink.createMany.mockResolvedValue({ count: 0 });
    prismaMock.machineEventIngestRun.update.mockResolvedValue({
      id: "run_batch_1",
      machineSourceId: "machine_1",
      machineSource: machine,
      machineEvents: [],
      ingestType: "EVENT_BATCH",
      sourceReference: null,
      rawEnvelopeJson: {},
      receivedAt: new Date("2026-03-08T10:10:00.000Z"),
      processedAt: new Date("2026-03-08T10:12:00.000Z"),
      status: "PARTIAL",
      createdAt: new Date("2026-03-08T10:10:00.000Z")
    });

    const result = await ingestMachineEventBatch(
      {
        machineSourceCode: "CNC-PRIMARY",
        events: [
          {
            externalEventId: "evt-a",
            eventType: "HEARTBEAT",
            eventTimestamp: "2026-03-08T10:10:00.000Z",
            sourceType: "API",
            payload: { machineState: "RUNNING" }
          },
          {
            externalEventId: "evt-b",
            eventType: "PROGRAM_STARTED",
            eventTimestamp: "bad-timestamp",
            sourceType: "API",
            payload: {}
          }
        ]
      },
      "org_local_craft_board"
    );

    expect(result.ok).toBe(true);
    expect(result.ingestRun.status).toBe("PARTIAL");
    expect(result.events[0]?.event.processingStatus).toBe("NORMALIZED");
    expect(result.events[1]?.ok).toBe(false);
  });
});

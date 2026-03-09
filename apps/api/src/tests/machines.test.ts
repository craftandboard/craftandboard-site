import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  machine: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  machineEvent: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  batch: {
    findFirst: vi.fn()
  },
  manufacturingJob: {
    findFirst: vi.fn()
  },
  part: {
    findFirst: vi.fn()
  }
}));

const stageSignalMocks = vi.hoisted(() => ({
  safeGenerateStageCandidatesForMachineEvent: vi.fn().mockResolvedValue([])
}));

const trustedAutoApplyMocks = vi.hoisted(() => ({
  evaluateTrustedAutoApplyForCandidate: vi.fn().mockResolvedValue({ matched: false, autoApplied: false })
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/stageSignals/service.js", () => stageSignalMocks);
vi.mock("../modules/trustedAutoApply/evaluation.js", () => trustedAutoApplyMocks);

import {
  createMachine,
  getMachineDetail,
  ingestMachineEvent,
  listMachineEvents,
  listMachines,
  updateMachine
} from "../modules/machines/service.js";
import { simulateMachineEvent } from "../modules/machines/simulation.js";

describe("machines service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates, lists, and updates machines", async () => {
    prismaMock.machine.create.mockResolvedValue({
      id: "machine_1",
      code: "CNC-01",
      name: "Shop CNC",
      type: "CNC",
      status: "ACTIVE",
      locationLabel: "Cut Bay",
      adapterType: "generic",
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });
    prismaMock.machine.findMany.mockResolvedValue([
      {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC",
        status: "ACTIVE",
        locationLabel: "Cut Bay",
        adapterType: "generic",
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z")
      }
    ]);
    prismaMock.machine.findFirst.mockResolvedValue({
      id: "machine_1",
      code: "CNC-01",
      name: "Shop CNC",
      type: "CNC",
      status: "ACTIVE",
      locationLabel: "Cut Bay",
      adapterType: "generic",
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });
    prismaMock.machine.update.mockResolvedValue({
      id: "machine_1",
      code: "CNC-01",
      name: "Updated CNC",
      type: "CNC",
      status: "HOLD",
      locationLabel: "Service Bay",
      adapterType: "generic",
      notes: "Needs service",
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T02:00:00.000Z")
    });

    const created = await createMachine(
      {
        code: "cnc-01",
        name: "Shop CNC",
        type: "CNC",
        locationLabel: "Cut Bay",
        adapterType: "generic"
      },
      "org_local_craft_board"
    );
    const listed = await listMachines("org_local_craft_board");
    const updated = await updateMachine(
      "machine_1",
      {
        name: "Updated CNC",
        status: "HOLD",
        locationLabel: "Service Bay",
        notes: "Needs service"
      },
      "org_local_craft_board"
    );

    expect(created.machine.code).toBe("CNC-01");
    expect(listed.summary.totalMachines).toBe(1);
    expect(updated.machine.status).toBe("HOLD");
  });

  it("ingests an event and links it to part, batch, and job context when refs exist", async () => {
    stageSignalMocks.safeGenerateStageCandidatesForMachineEvent.mockResolvedValue([
      { id: "sig_1" }
    ]);
    prismaMock.machine.findFirst.mockResolvedValue({
      id: "machine_1",
      code: "CNC-01",
      name: "Shop CNC",
      type: "CNC"
    });
    prismaMock.part.findFirst.mockResolvedValue({
      id: "part_1"
    });
    prismaMock.batch.findFirst.mockResolvedValue({
      id: "batch_1"
    });
    prismaMock.manufacturingJob.findFirst.mockResolvedValue({
      id: "job_1"
    });
    prismaMock.machineEvent.create.mockResolvedValue({
      id: "evt_1",
      machineId: "machine_1",
      machine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      eventType: "PART_SCANNED",
      eventTs: new Date("2026-03-08T10:00:00.000Z"),
      sourceType: "API",
      sourceEventId: null,
      payloadJson: { scanCode: "PART-part_1" },
      normalizedBatchRef: "BATCH-1",
      normalizedJobRef: "JOB-1",
      normalizedPartRef: "PART-part_1",
      sheetRef: null,
      severity: null,
      processingStatus: "LINKED",
      linkedBatchId: "batch_1",
      linkedManufacturingJobId: "job_1",
      linkedPartId: "part_1",
      linkedBatch: { id: "batch_1", code: "BATCH-1" },
      linkedManufacturingJob: { id: "job_1", labelCode: "JOB-1" },
      linkedPart: { id: "part_1", scanCode: "PART-part_1", partCode: "PARTCODE-1" },
      notes: null,
      createdAt: new Date("2026-03-08T10:00:00.000Z")
    });

    const result = await ingestMachineEvent(
      {
        machineCode: "CNC-01",
        eventType: "PART_SCANNED",
        sourceType: "API",
        payload: { scanCode: "PART-part_1" },
        batchRef: "BATCH-1",
        jobRef: "JOB-1",
        scanCode: "PART-part_1"
      },
      "org_local_craft_board"
    );

    expect(result.linkResult.processingStatus).toBe("LINKED");
    expect(result.linkResult.linkedPartId).toBe("part_1");
    expect(prismaMock.machineEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          machineId: "machine_1",
          normalizedPartRef: "PART-part_1",
          linkedPartId: "part_1",
          linkedBatchId: "batch_1",
          linkedManufacturingJobId: "job_1"
        })
      })
    );
    expect(trustedAutoApplyMocks.evaluateTrustedAutoApplyForCandidate).toHaveBeenCalledWith("sig_1", "org_local_craft_board");
  });

  it("stores unmatched events safely", async () => {
    prismaMock.machine.findFirst.mockResolvedValue({
      id: "machine_1",
      code: "EDGE-01",
      name: "Edge 1",
      type: "EDGEBANDER"
    });
    prismaMock.part.findFirst.mockResolvedValue(null);
    prismaMock.batch.findFirst.mockResolvedValue(null);
    prismaMock.manufacturingJob.findFirst.mockResolvedValue(null);
    prismaMock.machineEvent.create.mockResolvedValue({
      id: "evt_2",
      machineId: "machine_1",
      machine: {
        id: "machine_1",
        code: "EDGE-01",
        name: "Edge 1",
        type: "EDGEBANDER"
      },
      eventType: "FAULT",
      eventTs: new Date("2026-03-08T10:00:00.000Z"),
      sourceType: "API",
      sourceEventId: null,
      payloadJson: { faultCode: "E99" },
      normalizedBatchRef: null,
      normalizedJobRef: null,
      normalizedPartRef: null,
      sheetRef: null,
      severity: "high",
      processingStatus: "UNMATCHED",
      linkedBatchId: null,
      linkedManufacturingJobId: null,
      linkedPartId: null,
      linkedBatch: null,
      linkedManufacturingJob: null,
      linkedPart: null,
      notes: null,
      createdAt: new Date("2026-03-08T10:00:00.000Z")
    });

    const result = await ingestMachineEvent(
      {
        machineCode: "EDGE-01",
        eventType: "FAULT",
        sourceType: "API",
        severity: "high",
        payload: { faultCode: "E99" }
      },
      "org_local_craft_board"
    );

    expect(result.linkResult.processingStatus).toBe("UNMATCHED");
    expect(result.event.processingStatus).toBe("UNMATCHED");
  });

  it("lists filtered events and machine detail", async () => {
    prismaMock.machineEvent.findMany.mockResolvedValue([
      {
        id: "evt_1",
        machineId: "machine_1",
        machine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Shop CNC",
          type: "CNC"
        },
        eventType: "RUN_STARTED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        sourceType: "MANUAL_SIMULATION",
        sourceEventId: null,
        payloadJson: { batchRef: "BATCH-1" },
        normalizedBatchRef: "BATCH-1",
        normalizedJobRef: null,
        normalizedPartRef: null,
        sheetRef: null,
        severity: null,
        processingStatus: "LINKED",
        linkedBatch: { id: "batch_1", code: "BATCH-1" },
        linkedManufacturingJob: null,
        linkedPart: null,
        notes: null,
        createdAt: new Date("2026-03-08T10:00:00.000Z")
      }
    ]);
    prismaMock.machine.findFirst.mockResolvedValue({
      id: "machine_1",
      code: "CNC-01",
      name: "Shop CNC",
      type: "CNC",
      status: "ACTIVE",
      locationLabel: "Cut Bay",
      adapterType: "generic",
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      events: [
        {
          id: "evt_1",
          machineId: "machine_1",
          machine: {
            id: "machine_1",
            code: "CNC-01",
            name: "Shop CNC",
            type: "CNC"
          },
          eventType: "RUN_STARTED",
          eventTs: new Date("2026-03-08T10:00:00.000Z"),
          sourceType: "MANUAL_SIMULATION",
          sourceEventId: null,
          payloadJson: { batchRef: "BATCH-1" },
          normalizedBatchRef: "BATCH-1",
          normalizedJobRef: null,
          normalizedPartRef: null,
          sheetRef: null,
          severity: null,
          processingStatus: "LINKED",
          linkedBatch: { id: "batch_1", code: "BATCH-1" },
          linkedManufacturingJob: null,
          linkedPart: null,
          notes: null,
          createdAt: new Date("2026-03-08T10:00:00.000Z")
        }
      ]
    });

    const listResult = await listMachineEvents(
      {
        machineId: "machine_1",
        eventType: "RUN_STARTED",
        processingStatus: "LINKED"
      },
      "org_local_craft_board"
    );
    const detailResult = await getMachineDetail("machine_1", "org_local_craft_board");

    expect(prismaMock.machineEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          machineId: "machine_1",
          eventType: "RUN_STARTED",
          processingStatus: "LINKED"
        })
      })
    );
    expect(listResult.events).toHaveLength(1);
    expect(detailResult.recentEvents).toHaveLength(1);
  });

  it("supports simulation flow through manual simulation source type", async () => {
    prismaMock.machine.findFirst.mockResolvedValue({
      id: "machine_1",
      code: "CNC-01",
      name: "Shop CNC",
      type: "CNC"
    });
    prismaMock.part.findFirst.mockResolvedValue(null);
    prismaMock.batch.findFirst.mockResolvedValue({
      id: "batch_1"
    });
    prismaMock.manufacturingJob.findFirst.mockResolvedValue(null);
    prismaMock.machineEvent.create.mockResolvedValue({
      id: "evt_sim",
      machineId: "machine_1",
      machine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      eventType: "RUN_STARTED",
      eventTs: new Date("2026-03-08T10:00:00.000Z"),
      sourceType: "MANUAL_SIMULATION",
      sourceEventId: null,
      payloadJson: { simulated: true },
      normalizedBatchRef: "BATCH-1",
      normalizedJobRef: null,
      normalizedPartRef: null,
      sheetRef: null,
      severity: null,
      processingStatus: "LINKED",
      linkedBatchId: "batch_1",
      linkedManufacturingJobId: null,
      linkedPartId: null,
      linkedBatch: { id: "batch_1", code: "BATCH-1" },
      linkedManufacturingJob: null,
      linkedPart: null,
      notes: null,
      createdAt: new Date("2026-03-08T10:00:00.000Z")
    });

    const result = await simulateMachineEvent(
      {
        machineCode: "CNC-01",
        eventType: "RUN_STARTED",
        batchRef: "BATCH-1",
        payload: { simulated: true }
      },
      "org_local_craft_board"
    );

    expect(prismaMock.machineEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: "MANUAL_SIMULATION"
        })
      })
    );
    expect(result.event.sourceType).toBe("MANUAL_SIMULATION");
  });
});

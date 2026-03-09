import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  machineEvent: {
    findFirst: vi.fn()
  },
  stageCandidateSignal: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  }
}));

const partMocks = vi.hoisted(() => ({
  transitionPartStatusById: vi.fn()
}));

const batchMocks = vi.hoisted(() => ({
  transitionBatchStatus: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/parts/service.js", () => partMocks);
vi.mock("../modules/batches/service.js", () => batchMocks);

import {
  applyStageCandidateSignal,
  generateStageCandidatesForMachineEvent,
  listStageCandidateSignals,
  rejectStageCandidateSignal
} from "../modules/stageSignals/service.js";

describe("stage signal service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a batch cut-in-progress candidate from linked cnc run start", async () => {
    prismaMock.machineEvent.findFirst.mockResolvedValue({
      id: "evt_1",
      machineId: "machine_1",
      eventType: "RUN_STARTED",
      processingStatus: "LINKED",
      linkedBatchId: "batch_1",
      linkedManufacturingJobId: null,
      linkedPartId: null,
      machine: {
        id: "machine_1",
        type: "CNC"
      },
      linkedBatch: {
        id: "batch_1",
        status: "PLANNED"
      },
      linkedManufacturingJob: null,
      linkedPart: null
    });
    prismaMock.stageCandidateSignal.findFirst.mockResolvedValue(null);
    prismaMock.stageCandidateSignal.create.mockResolvedValue({
      id: "sig_1",
      targetType: "BATCH",
      candidateStage: "CUTTING",
      currentStage: "PLANNED",
      recommendedAction: "MARK_BATCH_CUT_IN_PROGRESS",
      confidence: "HIGH",
      rationale: "Linked CNC RUN_STARTED event indicates the batch has likely entered cutting.",
      status: "OPEN",
      rejectionReason: null,
      notes: null,
      reviewedAt: null,
      appliedAt: null,
      rejectedAt: null,
      createdAt: new Date("2026-03-08T10:00:00.000Z"),
      sourceMachine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      sourceMachineEvent: {
        id: "evt_1",
        eventType: "RUN_STARTED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        processingStatus: "LINKED"
      },
      targetBatch: {
        id: "batch_1",
        code: "BATCH-1",
        status: "PLANNED"
      },
      targetManufacturingJob: null,
      targetPart: null
    });

    const result = await generateStageCandidatesForMachineEvent("evt_1", "org_local_craft_board");

    expect(result).toHaveLength(1);
    expect(result[0].recommendedAction).toBe("MARK_BATCH_CUT_IN_PROGRESS");
  });

  it("does not create candidates for unmatched events", async () => {
    prismaMock.machineEvent.findFirst.mockResolvedValue({
      id: "evt_2",
      processingStatus: "UNMATCHED"
    });

    const result = await generateStageCandidatesForMachineEvent("evt_2", "org_local_craft_board");

    expect(result).toEqual([]);
    expect(prismaMock.stageCandidateSignal.create).not.toHaveBeenCalled();
  });

  it("avoids duplicate open candidates for the same event/action/target", async () => {
    prismaMock.machineEvent.findFirst.mockResolvedValue({
      id: "evt_3",
      machineId: "machine_1",
      eventType: "PART_SCANNED",
      processingStatus: "LINKED",
      linkedBatchId: null,
      linkedManufacturingJobId: null,
      linkedPartId: "part_1",
      machine: {
        id: "machine_1",
        type: "CNC"
      },
      linkedBatch: null,
      linkedManufacturingJob: null,
      linkedPart: {
        id: "part_1",
        status: "READY_FOR_BATCH"
      }
    });
    prismaMock.stageCandidateSignal.findFirst.mockResolvedValue({
      id: "sig_existing"
    });

    const result = await generateStageCandidatesForMachineEvent("evt_3", "org_local_craft_board");

    expect(result).toEqual([]);
    expect(prismaMock.stageCandidateSignal.create).not.toHaveBeenCalled();
  });

  it("applies supported candidates through existing service-layer transitions", async () => {
    prismaMock.stageCandidateSignal.findFirst.mockResolvedValue({
      id: "sig_2",
      status: "OPEN",
      recommendedAction: "MARK_PART_CUT",
      targetPartId: "part_1",
      targetBatchId: null,
      targetManufacturingJobId: null,
      sourceMachine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      sourceMachineEvent: {
        id: "evt_3",
        eventType: "PART_SCANNED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        processingStatus: "LINKED"
      },
      targetBatch: null,
      targetManufacturingJob: null,
      targetPart: {
        id: "part_1",
        scanCode: "PART-part_1",
        partCode: "PARTCODE-1",
        status: "READY_FOR_BATCH"
      }
    });
    partMocks.transitionPartStatusById.mockResolvedValue({
      part: {
        id: "part_1",
        status: "cut"
      }
    });
    prismaMock.stageCandidateSignal.update.mockResolvedValue({
      id: "sig_2",
      targetType: "PART",
      candidateStage: "CUT",
      currentStage: "READY_FOR_BATCH",
      recommendedAction: "MARK_PART_CUT",
      confidence: "HIGH",
      rationale: "Linked CNC part event indicates the part is likely cut and ready for the next stage.",
      status: "APPLIED",
      appliedMode: "MANUAL",
      autoAppliedAt: null,
      autoApplyRationale: null,
      autoAppliedByRule: null,
      rejectionReason: null,
      notes: null,
      reviewedAt: new Date("2026-03-08T10:05:00.000Z"),
      appliedAt: new Date("2026-03-08T10:05:00.000Z"),
      rejectedAt: null,
      createdAt: new Date("2026-03-08T10:00:00.000Z"),
      sourceMachine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      sourceMachineEvent: {
        id: "evt_3",
        eventType: "PART_SCANNED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        processingStatus: "LINKED"
      },
      targetBatch: null,
      targetManufacturingJob: null,
      targetPart: {
        id: "part_1",
        scanCode: "PART-part_1",
        partCode: "PARTCODE-1",
        status: "CUT"
      }
    });

    const result = await applyStageCandidateSignal(
      "sig_2",
      {
        reviewedByMemberId: "member_1"
      },
      "org_local_craft_board"
    );

    expect(partMocks.transitionPartStatusById).toHaveBeenCalledWith("part_1", "cut", "org_local_craft_board");
    expect(result.candidate.status).toBe("APPLIED");
    expect(result.candidate.appliedMode).toBe("MANUAL");
  });

  it("maps null auto-apply audit fields safely for legacy or manual records", async () => {
    prismaMock.stageCandidateSignal.findMany.mockResolvedValue([
      {
        id: "sig_legacy",
        targetType: "PART",
        candidateStage: "CUT",
        currentStage: "READY_FOR_BATCH",
        recommendedAction: "MARK_PART_CUT",
        confidence: "HIGH",
        rationale: "Legacy manual candidate.",
        status: "OPEN",
        appliedMode: null,
        autoAppliedAt: null,
        autoApplyRationale: null,
        autoAppliedByRule: null,
        rejectionReason: null,
        notes: null,
        reviewedAt: null,
        appliedAt: null,
        rejectedAt: null,
        createdAt: new Date("2026-03-08T10:00:00.000Z"),
        sourceMachine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Shop CNC",
          type: "CNC"
        },
        sourceMachineEvent: {
          id: "evt_legacy",
          eventType: "PART_SCANNED",
          eventTs: new Date("2026-03-08T10:00:00.000Z"),
          processingStatus: "LINKED"
        },
        targetBatch: null,
        targetManufacturingJob: null,
        targetPart: {
          id: "part_legacy",
          scanCode: "PART-part_legacy",
          partCode: "PARTCODE-LEGACY",
          status: "READY_FOR_BATCH"
        }
      }
    ]);

    const result = await listStageCandidateSignals({}, "org_local_craft_board");

    expect(result.candidates[0].appliedMode).toBeUndefined();
    expect(result.candidates[0].autoAppliedAt).toBeUndefined();
    expect(result.candidates[0].autoApplyRationale).toBeUndefined();
    expect(result.candidates[0].autoAppliedByRule).toBeUndefined();
  });

  it("rejects candidates with audit fields", async () => {
    prismaMock.stageCandidateSignal.findFirst.mockResolvedValue({
      id: "sig_3",
      status: "OPEN"
    });
    prismaMock.stageCandidateSignal.update.mockResolvedValue({
      id: "sig_3",
      targetType: "BATCH",
      candidateStage: "CUT_COMPLETE",
      currentStage: "CUTTING",
      recommendedAction: "MARK_BATCH_CUT_COMPLETE",
      confidence: "HIGH",
      rationale: "Linked CNC RUN_COMPLETED event indicates the batch cut is likely complete.",
      status: "REJECTED",
      rejectionReason: "Operator verified this run was aborted.",
      notes: null,
      reviewedAt: new Date("2026-03-08T10:06:00.000Z"),
      appliedAt: null,
      rejectedAt: new Date("2026-03-08T10:06:00.000Z"),
      createdAt: new Date("2026-03-08T10:00:00.000Z"),
      sourceMachine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      sourceMachineEvent: {
        id: "evt_4",
        eventType: "RUN_COMPLETED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        processingStatus: "LINKED"
      },
      targetBatch: {
        id: "batch_1",
        code: "BATCH-1",
        status: "CUTTING"
      },
      targetManufacturingJob: null,
      targetPart: null
    });
    prismaMock.stageCandidateSignal.findFirstOrThrow.mockResolvedValue({
      id: "sig_3",
      targetType: "BATCH",
      candidateStage: "CUT_COMPLETE",
      currentStage: "CUTTING",
      recommendedAction: "MARK_BATCH_CUT_COMPLETE",
      confidence: "HIGH",
      rationale: "Linked CNC RUN_COMPLETED event indicates the batch cut is likely complete.",
      status: "REJECTED",
      rejectionReason: "Operator verified this run was aborted.",
      notes: null,
      reviewedAt: new Date("2026-03-08T10:06:00.000Z"),
      appliedAt: null,
      rejectedAt: new Date("2026-03-08T10:06:00.000Z"),
      createdAt: new Date("2026-03-08T10:00:00.000Z"),
      sourceMachine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Shop CNC",
        type: "CNC"
      },
      sourceMachineEvent: {
        id: "evt_4",
        eventType: "RUN_COMPLETED",
        eventTs: new Date("2026-03-08T10:00:00.000Z"),
        processingStatus: "LINKED"
      },
      targetBatch: {
        id: "batch_1",
        code: "BATCH-1",
        status: "CUTTING"
      },
      targetManufacturingJob: null,
      targetPart: null
    });

    const result = await rejectStageCandidateSignal(
      "sig_3",
      {
        reviewedByMemberId: "member_1",
        rejectionReason: "Operator verified this run was aborted."
      },
      "org_local_craft_board"
    );

    expect(result.candidate.status).toBe("REJECTED");
    expect(result.candidate.rejectionReason).toBe("Operator verified this run was aborted.");
  });

  it("lists candidates with filters", async () => {
    prismaMock.stageCandidateSignal.findMany.mockResolvedValue([
      {
        id: "sig_4",
        targetType: "PART",
        candidateStage: "CUT",
        currentStage: "READY_FOR_BATCH",
        recommendedAction: "MARK_PART_CUT",
        confidence: "HIGH",
        rationale: "Linked CNC part event indicates the part is likely cut and ready for the next stage.",
        status: "OPEN",
        rejectionReason: null,
        notes: null,
        reviewedAt: null,
        appliedAt: null,
        rejectedAt: null,
        createdAt: new Date("2026-03-08T10:00:00.000Z"),
        sourceMachine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Shop CNC",
          type: "CNC"
        },
        sourceMachineEvent: {
          id: "evt_5",
          eventType: "PART_SCANNED",
          eventTs: new Date("2026-03-08T10:00:00.000Z"),
          processingStatus: "LINKED"
        },
        targetBatch: null,
        targetManufacturingJob: null,
        targetPart: {
          id: "part_1",
          scanCode: "PART-part_1",
          partCode: "PARTCODE-1",
          status: "READY_FOR_BATCH"
        }
      }
    ]);

    const result = await listStageCandidateSignals(
      {
        status: "OPEN",
        targetType: "PART",
        machineId: "machine_1"
      },
      "org_local_craft_board"
    );

    expect(prismaMock.stageCandidateSignal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "OPEN",
          targetType: "PART",
          sourceMachineId: "machine_1"
        })
      })
    );
    expect(result.summary.openCount).toBe(1);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  trustedAutoApplyRule: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  machine: {
    findFirst: vi.fn()
  },
  stageCandidateSignal: {
    findFirst: vi.fn()
  }
}));

const stageSignalMocks = vi.hoisted(() => ({
  autoApplyStageCandidateSignal: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/stageSignals/service.js", () => stageSignalMocks);

import {
  createTrustedAutoApplyRule,
  disableTrustedAutoApplyRule,
  listTrustedAutoApplyRules,
  updateTrustedAutoApplyRule
} from "../modules/trustedAutoApply/service.js";
import { evaluateTrustedAutoApplyForCandidate } from "../modules/trustedAutoApply/evaluation.js";

describe("trusted auto-apply service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates, lists, updates, and disables trusted rules", async () => {
    prismaMock.machine.findFirst.mockResolvedValue({
      id: "machine_1"
    });
    prismaMock.trustedAutoApplyRule.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "rule_1",
        organizationId: "org_local_craft_board",
        machineId: "machine_1",
        machineType: null,
        candidateAction: "MARK_PART_CUT",
        enabled: true,
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z"),
        machine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Router 1",
          type: "CNC",
          status: "ACTIVE"
        }
      })
      .mockResolvedValueOnce({
        id: "rule_1",
        organizationId: "org_local_craft_board"
      });
    prismaMock.trustedAutoApplyRule.create.mockResolvedValue({
      id: "rule_1",
      organizationId: "org_local_craft_board",
      machineId: "machine_1",
      machineType: null,
      candidateAction: "MARK_PART_CUT",
      enabled: true,
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      machine: {
        id: "machine_1",
        code: "CNC-01",
        name: "Router 1",
        type: "CNC",
        status: "ACTIVE"
      }
    });
    prismaMock.trustedAutoApplyRule.findMany.mockResolvedValue([
      {
        id: "rule_1",
        organizationId: "org_local_craft_board",
        machineId: "machine_1",
        machineType: null,
        candidateAction: "MARK_PART_CUT",
        enabled: true,
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z"),
        machine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Router 1",
          type: "CNC",
          status: "ACTIVE"
        }
      }
    ]);
    prismaMock.trustedAutoApplyRule.update
      .mockResolvedValueOnce({
        id: "rule_1",
        organizationId: "org_local_craft_board",
        machineId: "machine_1",
        machineType: null,
        candidateAction: "MARK_PART_CUT",
        enabled: false,
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T01:00:00.000Z"),
        machine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Router 1",
          type: "CNC",
          status: "ACTIVE"
        }
      })
      .mockResolvedValueOnce({
        id: "rule_1",
        organizationId: "org_local_craft_board",
        machineId: "machine_1",
        machineType: null,
        candidateAction: "MARK_PART_CUT",
        enabled: false,
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T01:30:00.000Z"),
        machine: {
          id: "machine_1",
          code: "CNC-01",
          name: "Router 1",
          type: "CNC",
          status: "ACTIVE"
        }
      });

    const created = await createTrustedAutoApplyRule(
      {
        machineId: "machine_1",
        candidateAction: "MARK_PART_CUT"
      },
      "org_local_craft_board"
    );
    const listed = await listTrustedAutoApplyRules("org_local_craft_board");
    const updated = await updateTrustedAutoApplyRule("rule_1", { enabled: false }, "org_local_craft_board");
    const disabled = await disableTrustedAutoApplyRule("rule_1", "org_local_craft_board");

    expect(created.rule.id).toBe("rule_1");
    expect(listed.rules).toHaveLength(1);
    expect(updated.rule.enabled).toBe(false);
    expect(disabled.rule.enabled).toBe(false);
  });

  it("auto-applies eligible candidates when a machine-specific rule matches", async () => {
    prismaMock.stageCandidateSignal.findFirst.mockResolvedValue({
      id: "sig_1",
      organizationId: "org_local_craft_board",
      status: "OPEN",
      confidence: "HIGH",
      recommendedAction: "MARK_PART_CUT",
      sourceMachine: {
        id: "machine_1",
        type: "CNC",
        status: "ACTIVE"
      }
    });
    prismaMock.trustedAutoApplyRule.findFirst
      .mockResolvedValueOnce({
        id: "rule_machine",
        machineId: "machine_1",
        machineType: null
      })
      .mockResolvedValueOnce(null);
    stageSignalMocks.autoApplyStageCandidateSignal.mockResolvedValue({
      ok: true
    });

    const result = await evaluateTrustedAutoApplyForCandidate("sig_1", "org_local_craft_board");

    expect(result).toEqual({
      matched: true,
      autoApplied: true,
      ruleId: "rule_machine"
    });
    expect(stageSignalMocks.autoApplyStageCandidateSignal).toHaveBeenCalledWith(
      "sig_1",
      expect.objectContaining({
        ruleId: "rule_machine"
      }),
      "org_local_craft_board"
    );
  });

  it("prefers machine-specific rules over machine-type rules", async () => {
    prismaMock.stageCandidateSignal.findFirst.mockResolvedValue({
      id: "sig_2",
      organizationId: "org_local_craft_board",
      status: "OPEN",
      confidence: "HIGH",
      recommendedAction: "MARK_PART_CUT",
      sourceMachine: {
        id: "machine_1",
        type: "CNC",
        status: "ACTIVE"
      }
    });
    prismaMock.trustedAutoApplyRule.findFirst.mockResolvedValueOnce({
      id: "rule_machine",
      machineId: "machine_1",
      machineType: null
    });
    stageSignalMocks.autoApplyStageCandidateSignal.mockResolvedValue({
      ok: true
    });

    await evaluateTrustedAutoApplyForCandidate("sig_2", "org_local_craft_board");

    expect(prismaMock.trustedAutoApplyRule.findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          machineId: "machine_1",
          candidateAction: "MARK_PART_CUT",
          enabled: true
        })
      })
    );
  });

  it("leaves candidates open when rule is disabled, missing, or action is unsupported", async () => {
    prismaMock.stageCandidateSignal.findFirst
      .mockResolvedValueOnce({
        id: "sig_3",
        organizationId: "org_local_craft_board",
        status: "OPEN",
        confidence: "HIGH",
        recommendedAction: "MARK_PART_CUT",
        sourceMachine: {
          id: "machine_1",
          type: "CNC",
          status: "ACTIVE"
        }
      })
      .mockResolvedValueOnce({
        id: "sig_4",
        organizationId: "org_local_craft_board",
        status: "OPEN",
        confidence: "MEDIUM",
        recommendedAction: "MARK_PART_CUT",
        sourceMachine: {
          id: "machine_1",
          type: "CNC",
          status: "ACTIVE"
        }
      })
      .mockResolvedValueOnce({
        id: "sig_5",
        organizationId: "org_local_craft_board",
        status: "OPEN",
        confidence: "HIGH",
        recommendedAction: "MARK_JOB_EDGE_COMPLETE",
        sourceMachine: {
          id: "machine_2",
          type: "EDGEBANDER",
          status: "ACTIVE"
        }
      });
    prismaMock.trustedAutoApplyRule.findFirst.mockResolvedValue(null);

    const noRule = await evaluateTrustedAutoApplyForCandidate("sig_3", "org_local_craft_board");
    const mediumConfidence = await evaluateTrustedAutoApplyForCandidate("sig_4", "org_local_craft_board");
    const unsupported = await evaluateTrustedAutoApplyForCandidate("sig_5", "org_local_craft_board");

    expect(noRule.autoApplied).toBe(false);
    expect(mediumConfidence.autoApplied).toBe(false);
    expect(unsupported.autoApplied).toBe(false);
    expect(stageSignalMocks.autoApplyStageCandidateSignal).not.toHaveBeenCalled();
  });
});

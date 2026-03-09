import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createScanEvent: vi.fn(),
  createWorkflowStationRule: vi.fn(),
  findManufacturingBatchByBatchNumber: vi.fn(),
  findManufacturingPartById: vi.fn(),
  findManufacturingPartByPartNumber: vi.fn(),
  getScanEventById: vi.fn(),
  listScanEvents: vi.fn(),
  listWorkflowStationRules: vi.fn(),
  updateManufacturingPartStatus: vi.fn(),
  updateWorkflowStationRule: vi.fn()
}));

vi.mock("../modules/scanning/repository.js", () => repositoryMocks);

import {
  createWorkflowStationRuleRecord,
  getScanEventsView,
  lookupScan,
  scanManufacturingPart,
  updateWorkflowStationRuleRecord
} from "../modules/scanning/service.js";

function buildPart(status: string) {
  return {
    id: "part_1",
    partNumber: "MP-20260308-001-P0001",
    status,
    materialType: "WHITE_MELAMINE",
    thicknessIn: { toNumber: () => 0.75 },
    lengthIn: { toNumber: () => 30 },
    depthIn: { toNumber: () => 12 },
    edgeBandPattern: "ALL_FOUR",
    manufacturingPacketId: "packet_1",
    manufacturingPacket: { packetNumber: "MP-20260308-001" },
    batchId: "batch_1",
    batch: { batchNumber: "CUT-20260308-001" },
    salesOrderId: "sales_order_1",
    salesOrderItemId: "item_1",
    shelfJobId: "shelf_job_1",
    salesOrderItem: { title: "30 x 12 White Shelf", shelfProduct: { name: "3/4 White Melamine Shelf" } }
  };
}

describe("scanning service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.listWorkflowStationRules.mockResolvedValue([]);
    repositoryMocks.createScanEvent.mockImplementation(async (input: any) => ({
      id: "scan_1",
      ...input,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    }));
    repositoryMocks.findManufacturingPartByPartNumber.mockResolvedValue(buildPart("READY_FOR_BATCH"));
    repositoryMocks.updateManufacturingPartStatus.mockImplementation(async (input: any) => buildPart(input.nextStatus));
    repositoryMocks.listScanEvents.mockResolvedValue([
      {
        id: "scan_1",
        entityType: "MANUFACTURING_PART",
        entityId: "part_1",
        scanValue: "PART:MP-20260308-001-P0001",
        stationType: "CUT",
        actionType: "CHECK_IN",
        previousStatus: "READY_FOR_BATCH",
        nextStatus: "CUT_IN_PROGRESS",
        result: "ACCEPTED",
        resultReason: null,
        metadataJson: null,
        scannedByUserId: "user_1",
        manufacturingPartId: "part_1",
        manufacturingBatchId: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z")
      }
    ]);
  });

  it("returns part lookup with allowed actions", async () => {
    const result = await lookupScan({
      organizationId: "org_local_craft_board",
      scanValue: "PART:MP-20260308-001-P0001",
      stationType: "CUT",
      scannedByUserId: "user_1"
    });

    expect(result.entityType).toBe("MANUFACTURING_PART");
    expect(result.allowedActions).toEqual([
      {
        actionType: "CHECK_IN",
        nextStatus: "CUT_IN_PROGRESS",
        source: "default"
      }
    ]);
    expect(repositoryMocks.createScanEvent).toHaveBeenCalledTimes(1);
  });

  it("applies a valid cut transition and records an accepted scan event", async () => {
    const result = await scanManufacturingPart({
      organizationId: "org_local_craft_board",
      scanValue: "PART:MP-20260308-001-P0001",
      stationType: "CUT",
      actionType: "CHECK_IN",
      scannedByUserId: "user_1"
    });

    expect(repositoryMocks.updateManufacturingPartStatus).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      partId: "part_1",
      nextStatus: "CUT_IN_PROGRESS"
    });
    expect(result.part.status).toBe("CUT_IN_PROGRESS");
    expect(result.event.result).toBe("ACCEPTED");
  });

  it("applies a valid edgeband transition", async () => {
    repositoryMocks.findManufacturingPartByPartNumber.mockResolvedValue(buildPart("CUT_COMPLETE"));

    const result = await scanManufacturingPart({
      organizationId: "org_local_craft_board",
      scanValue: "PART:MP-20260308-001-P0001",
      stationType: "EDGEBAND",
      actionType: "CHECK_IN",
      scannedByUserId: "user_1"
    });

    expect(result.part.status).toBe("EDGEBAND_IN_PROGRESS");
  });

  it("applies a valid packaging transition", async () => {
    repositoryMocks.findManufacturingPartByPartNumber.mockResolvedValue(buildPart("PACKAGING_IN_PROGRESS"));

    const result = await scanManufacturingPart({
      organizationId: "org_local_craft_board",
      scanValue: "PART:MP-20260308-001-P0001",
      stationType: "PACKAGING",
      actionType: "MARK_STAGE_COMPLETE",
      scannedByUserId: "user_1"
    });

    expect(result.part.status).toBe("PACKAGED");
  });

  it("rejects an invalid station transition and still records an audit event", async () => {
    repositoryMocks.findManufacturingPartByPartNumber.mockResolvedValue(buildPart("READY_FOR_BATCH"));

    await expect(
      scanManufacturingPart({
        organizationId: "org_local_craft_board",
        scanValue: "PART:MP-20260308-001-P0001",
        stationType: "PACKAGING",
        actionType: "MARK_STAGE_COMPLETE",
        scannedByUserId: "user_1"
      })
    ).rejects.toThrow("No workflow transition exists");

    expect(repositoryMocks.createScanEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "REJECTED",
        manufacturingPartId: "part_1"
      })
    );
  });

  it("respects a configured workflow station rule override", async () => {
    repositoryMocks.listWorkflowStationRules.mockResolvedValue([
      {
        id: "rule_1",
        stationType: "CUT",
        entityType: "MANUFACTURING_PART",
        fromStatus: "READY_FOR_BATCH",
        actionType: "CHECK_IN",
        toStatus: "CUT_PENDING",
        isActive: true,
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z")
      }
    ]);

    const result = await scanManufacturingPart({
      organizationId: "org_local_craft_board",
      scanValue: "PART:MP-20260308-001-P0001",
      stationType: "CUT",
      actionType: "CHECK_IN",
      scannedByUserId: "user_1"
    });

    expect(repositoryMocks.updateManufacturingPartStatus).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      partId: "part_1",
      nextStatus: "CUT_PENDING"
    });
    expect(result.event.resultReason).toContain("configured workflow station rule");
  });

  it("lists scan events", async () => {
    const result = await getScanEventsView({
      organizationId: "org_local_craft_board",
      stationType: "CUT"
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].scanValue).toBe("PART:MP-20260308-001-P0001");
  });

  it("creates and updates workflow station rules", async () => {
    repositoryMocks.createWorkflowStationRule.mockResolvedValue({
      id: "rule_1",
      stationType: "CUT",
      entityType: "MANUFACTURING_PART",
      fromStatus: "READY_FOR_BATCH",
      actionType: "CHECK_IN",
      toStatus: "CUT_PENDING",
      isActive: true,
      notes: "Override",
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });
    repositoryMocks.updateWorkflowStationRule.mockResolvedValue({
      id: "rule_1",
      stationType: "CUT",
      entityType: "MANUFACTURING_PART",
      fromStatus: "READY_FOR_BATCH",
      actionType: "CHECK_IN",
      toStatus: "CUT_IN_PROGRESS",
      isActive: false,
      notes: "Disabled",
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const created = await createWorkflowStationRuleRecord({
      organizationId: "org_local_craft_board",
      stationType: "CUT",
      entityType: "MANUFACTURING_PART",
      fromStatus: "READY_FOR_BATCH",
      actionType: "CHECK_IN",
      toStatus: "CUT_PENDING",
      notes: "Override"
    });
    const updated = await updateWorkflowStationRuleRecord({
      id: "rule_1",
      organizationId: "org_local_craft_board",
      isActive: false,
      notes: "Disabled"
    });

    expect(created.rule.id).toBe("rule_1");
    expect(updated.rule.isActive).toBe(false);
  });
});

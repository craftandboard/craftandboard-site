import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  addPartsToManufacturingBatch: vi.fn(),
  createLabelTemplateVersion: vi.fn(),
  createManufacturingBatch: vi.fn(),
  createManufacturingParts: vi.fn(),
  createPacketExpansionRun: vi.fn(),
  getManufacturingBatchById: vi.fn(),
  getManufacturingPacketForExpansion: vi.fn(),
  getManufacturingPartById: vi.fn(),
  getReadyManufacturingPartsByIds: vi.fn(),
  listLabelTemplateVersions: vi.fn(),
  listManufacturingBatches: vi.fn(),
  listManufacturingParts: vi.fn(),
  updateLabelTemplateVersion: vi.fn()
}));

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    manufacturingBatch: {
      count: vi.fn()
    }
  }
}));

vi.mock("../modules/manufacturingExpansion/repository.js", () => repositoryMocks);
vi.mock("../lib/prisma.js", () => prismaMocks);

import {
  createManufacturingBatchRecord,
  expandManufacturingPacket,
  getManufacturingPartLabel
} from "../modules/manufacturingExpansion/service.js";

describe("manufacturing expansion service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.prisma.manufacturingBatch.count.mockResolvedValue(0);
  });

  it("expands one packet into one part per unit quantity", async () => {
    repositoryMocks.getManufacturingPacketForExpansion.mockResolvedValue({
      id: "packet_1",
      packetNumber: "MP-20260308-001",
      expansionRun: null,
      parts: [],
      shelfJobs: [
        {
          id: "shelf_job_1",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_1",
          quantity: 3,
          normalizedSpecJson: {
            title: "White Shelf",
            lengthIn: 30,
            depthIn: 12,
            thicknessIn: 0.75,
            materialType: "WHITE_MELAMINE",
            edgeBandPattern: "ALL_FOUR",
            requiresPackaging: true
          },
          salesOrderItem: {
            title: "White Shelf"
          }
        }
      ]
    });
    repositoryMocks.createManufacturingParts.mockImplementation(async (input) =>
      input.parts.map((part: any) => ({
        ...part,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z"),
        thicknessIn: { toNumber: () => part.thicknessIn },
        lengthIn: { toNumber: () => part.lengthIn },
        depthIn: { toNumber: () => part.depthIn },
        status: "READY_FOR_BATCH"
      }))
    );
    repositoryMocks.createPacketExpansionRun.mockResolvedValue({
      id: "run_1",
      sourceJobCount: 1,
      createdPartCount: 3,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await expandManufacturingPacket({
      manufacturingPacketId: "packet_1",
      organizationId: "org_local_craft_board",
      createdByUserId: "user_1"
    });

    expect(result.parts).toHaveLength(3);
    expect(result.parts[0].partNumber).toBe("MP-20260308-001-P0001");
    expect(result.parts[2].unitIndex).toBe(3);
    expect(result.parts[0].salesOrderId).toBe("sales_order_1");
  });

  it("fails expansion when required job data is missing", async () => {
    repositoryMocks.getManufacturingPacketForExpansion.mockResolvedValue({
      id: "packet_1",
      packetNumber: "MP-20260308-001",
      expansionRun: null,
      parts: [],
      shelfJobs: [
        {
          id: "shelf_job_1",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_1",
          quantity: 2,
          normalizedSpecJson: {
            lengthIn: 30,
            thicknessIn: 0.75,
            materialType: "WHITE_MELAMINE",
            edgeBandPattern: "ALL_FOUR",
            requiresPackaging: true
          },
          salesOrderItem: {
            title: "Broken Shelf"
          }
        }
      ]
    });

    await expect(
      expandManufacturingPacket({
        manufacturingPacketId: "packet_1",
        organizationId: "org_local_craft_board"
      })
    ).rejects.toThrow("missing valid depthIn");
  });

  it("blocks repeated expansion of the same packet", async () => {
    repositoryMocks.getManufacturingPacketForExpansion.mockResolvedValue({
      id: "packet_1",
      packetNumber: "MP-20260308-001",
      expansionRun: { id: "run_1" },
      parts: [],
      shelfJobs: []
    });

    await expect(
      expandManufacturingPacket({
        manufacturingPacketId: "packet_1",
        organizationId: "org_local_craft_board"
      })
    ).rejects.toThrow("already been expanded");
  });

  it("creates a cut batch from ready parts and marks them batched", async () => {
    repositoryMocks.getReadyManufacturingPartsByIds.mockResolvedValue([
      {
        id: "part_1",
        materialType: "WHITE_MELAMINE",
        thicknessIn: { toNumber: () => 0.75 },
        status: "READY_FOR_BATCH"
      },
      {
        id: "part_2",
        materialType: "WHITE_MELAMINE",
        thicknessIn: { toNumber: () => 0.75 },
        status: "READY_FOR_BATCH"
      }
    ]);
    repositoryMocks.createManufacturingBatch.mockResolvedValue({
      id: "mb_1"
    });
    repositoryMocks.addPartsToManufacturingBatch.mockResolvedValue({
      id: "mb_1",
      batchNumber: "CUT-20260308-001",
      batchType: "CUT",
      materialType: "WHITE_MELAMINE",
      thicknessIn: { toNumber: () => 0.75 },
      status: "OPEN",
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      parts: [
        {
          id: "part_1",
          manufacturingPacketId: "packet_1",
          shelfJobId: "shelf_job_1",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_1",
          batchId: "mb_1",
          partNumber: "MP-20260308-001-P0001",
          serialNumber: null,
          unitIndex: 1,
          quantity: 1,
          partType: "SHELF",
          materialType: "WHITE_MELAMINE",
          thicknessIn: { toNumber: () => 0.75 },
          lengthIn: { toNumber: () => 30 },
          depthIn: { toNumber: () => 12 },
          edgeBandPattern: "ALL_FOUR",
          requiresPackaging: true,
          labelDataJson: {},
          status: "BATCHED",
          statusReason: null,
          sortGroup: null,
          createdAt: new Date("2026-03-08T00:00:00.000Z"),
          updatedAt: new Date("2026-03-08T00:00:00.000Z")
        }
      ],
      batchParts: []
    });

    const result = await createManufacturingBatchRecord({
      organizationId: "org_local_craft_board",
      batchType: "CUT",
      partIds: ["part_1", "part_2"]
    });

    expect(result.batch.batchNumber).toBe("CUT-20260308-001");
    expect(repositoryMocks.addPartsToManufacturingBatch).toHaveBeenCalled();
  });

  it("returns the label payload backbone for a manufacturing part", async () => {
    repositoryMocks.getManufacturingPartById.mockResolvedValue({
      id: "part_1",
      labelDataJson: {
        partNumber: "MP-20260308-001-P0001",
        barcodeValue: "PART:MP-20260308-001-P0001"
      }
    });

    const result = await getManufacturingPartLabel("part_1", "org_local_craft_board");

    expect(result).toEqual({
      ok: true,
      label: {
        partNumber: "MP-20260308-001-P0001",
        barcodeValue: "PART:MP-20260308-001-P0001"
      }
    });
  });
});

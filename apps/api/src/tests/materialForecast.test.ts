import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  part: {
    findMany: vi.fn()
  }
}));

const batchServiceMocks = vi.hoisted(() => ({
  createBatchFromSelectedJobs: vi.fn()
}));

const remnantCandidateMocks = vi.hoisted(() => ({
  getRemnantCandidatesForMaterial: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/batches/service.js", () => batchServiceMocks);
vi.mock("../modules/materialForecast/remnantCandidates.js", () => remnantCandidateMocks);
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));

import { createBatchFromForecastSelection, getMaterialForecast } from "../modules/materialForecast/service.js";

describe("material forecast service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remnantCandidateMocks.getRemnantCandidatesForMaterial.mockResolvedValue({
      candidateRemnantsCount: 0,
      candidateRemnantsAreaSqIn: 0,
      recommendedCoverageAreaSqIn: 0,
      estimatedNewSheetReduction: 0,
      candidateRemnantsPreview: []
    });
  });

  it("groups pending parts by deterministic material key and computes sheet estimates", async () => {
    prismaMock.part.findMany.mockResolvedValueOnce([
      {
        id: "part_1",
        orderId: "order_1",
        orderItemId: "item_1",
        manufacturingJobId: "job_1",
        partCode: "CFG-1-P01",
        scanCode: "PART-part_1",
        instanceNumber: 1,
        materialCode: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        widthIn: new Prisma.Decimal("19.25"),
        depthIn: new Prisma.Decimal("12.5"),
        thicknessIn: new Prisma.Decimal("0.75"),
        status: "READY_FOR_BATCH",
        order: {
          id: "order_1",
          customerName: "Brandon",
          shipByDate: new Date("2026-03-10T00:00:00.000Z"),
          status: "READY_FOR_BATCH"
        },
        manufacturingJob: {
          id: "job_1",
          source: "CONFIGURATOR",
          channel: "WEBSITE",
          labelCode: "SHELF-WM-19.25x12.5",
          status: "DRAFT"
        }
      },
      {
        id: "part_2",
        orderId: "order_2",
        orderItemId: "item_2",
        manufacturingJobId: "job_2",
        partCode: "AMZ-1-P01",
        scanCode: "PART-part_2",
        instanceNumber: 1,
        materialCode: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        widthIn: new Prisma.Decimal("24"),
        depthIn: new Prisma.Decimal("12"),
        thicknessIn: new Prisma.Decimal("0.75"),
        status: "PENDING",
        order: {
          id: "order_2",
          customerName: "Tyler",
          shipByDate: new Date("2026-03-12T00:00:00.000Z"),
          status: "IMPORTED"
        },
        manufacturingJob: {
          id: "job_2",
          source: "AMAZON",
          channel: "AMAZON",
          labelCode: "SHELF-WM-24x12",
          status: "DRAFT"
        }
      }
    ]);

    const result = await getMaterialForecast();

    expect(result.ok).toBe(true);
    expect(result.summary.totalPendingMaterials).toBe(1);
    expect(result.summary.totalPendingParts).toBe(2);
    expect(result.summary.estimatedTotalSheets).toBe(1);
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].materialKey).toBe("WHITE_MELAMINE:0.750:ALL_FOUR");
    expect(result.materials[0].pendingJobCount).toBe(2);
    expect(result.materials[0].pendingOrderCount).toBe(2);
    expect(result.materials[0].totalAreaSqIn).toBe(528.625);
    expect(result.materials[0].recommendedCoverageAreaSqIn).toBe(0);
    expect(result.materials[0].estimatedNewSheetReduction).toBe(0);
    expect(result.materials[0].jobs[0].parts[0].labelCode).toBe("SHELF-WM-19.25x12.5-P01");
  });

  it("creates a batch from selected forecast jobs", async () => {
    prismaMock.part.findMany
      .mockResolvedValueOnce([
        {
          id: "part_1",
          materialCode: "WHITE_MELAMINE",
          status: "READY_FOR_BATCH",
          orderId: "order_1",
          order: { id: "order_1", status: "READY_FOR_BATCH" },
          manufacturingJobId: "job_1",
          manufacturingJob: {
            id: "job_1",
            status: "DRAFT",
            batchId: null,
            materialCode: "WHITE_MELAMINE"
          }
        },
        {
          id: "part_2",
          materialCode: "WHITE_MELAMINE",
          status: "READY_FOR_BATCH",
          orderId: "order_1",
          order: { id: "order_1", status: "READY_FOR_BATCH" },
          manufacturingJobId: "job_1",
          manufacturingJob: {
            id: "job_1",
            status: "DRAFT",
            batchId: null,
            materialCode: "WHITE_MELAMINE"
          }
        }
      ])
      .mockResolvedValueOnce([
        { id: "part_1", manufacturingJobId: "job_1" },
        { id: "part_2", manufacturingJobId: "job_1" }
      ]);

    batchServiceMocks.createBatchFromSelectedJobs.mockResolvedValue({
      batch: {
        id: "batch_123",
        batchCode: "20260308-WHITE_MELAMINE-01",
        status: "DRAFT",
        material: "WHITE_MELAMINE",
        partCount: 2,
        jobCount: 1
      },
      parts: [
        { id: "part_1", partType: "SHELF", labelCode: "SHELF-WM-19.25x12.5-P01" },
        { id: "part_2", partType: "SHELF", labelCode: "SHELF-WM-19.25x12.5-P02" }
      ]
    });

    const result = await createBatchFromForecastSelection({
      materialCode: "WHITE_MELAMINE",
      jobIds: ["job_1"]
    });

    expect(batchServiceMocks.createBatchFromSelectedJobs).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      materialCode: "WHITE_MELAMINE",
      jobIds: ["job_1"],
      batchName: undefined
    });
    expect(result.action).toBe("create-forecast-batch");
    expect(result.batch.id).toBe("batch_123");
  });

  it("rejects partial job selection so forecast batching stays traceable", async () => {
    prismaMock.part.findMany
      .mockResolvedValueOnce([
        {
          id: "part_1",
          materialCode: "WHITE_MELAMINE",
          status: "READY_FOR_BATCH",
          orderId: "order_1",
          order: { id: "order_1", status: "READY_FOR_BATCH" },
          manufacturingJobId: "job_1",
          manufacturingJob: {
            id: "job_1",
            status: "DRAFT",
            batchId: null,
            materialCode: "WHITE_MELAMINE"
          }
        }
      ])
      .mockResolvedValueOnce([
        { id: "part_1", manufacturingJobId: "job_1" },
        { id: "part_2", manufacturingJobId: "job_1" }
      ]);

    await expect(
      createBatchFromForecastSelection({
        materialCode: "WHITE_MELAMINE",
        partIds: ["part_1"]
      })
    ).rejects.toThrow("Forecast selection must include all pending parts for job job_1 before batching.");
  });
});

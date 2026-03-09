import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createManufacturingPacket: vi.fn(),
  createSalesOrder: vi.fn(),
  createSalesOrderItems: vi.fn(),
  createShelfJob: vi.fn(),
  getManufacturingPacketById: vi.fn(),
  getSalesOrderById: vi.fn(),
  getShelfJobById: vi.fn(),
  listManufacturingPackets: vi.fn(),
  listSalesOrders: vi.fn(),
  listShelfJobs: vi.fn(),
  updateSalesOrderItem: vi.fn()
}));

const pricingServiceMocks = vi.hoisted(() => ({
  createPricingScenarioSnapshot: vi.fn()
}));

const settingsMocks = vi.hoisted(() => ({
  getMaterialProfile: vi.fn()
}));

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    costProfile: {
      findFirst: vi.fn()
    },
    productionAssumptionProfile: {
      findFirst: vi.fn()
    },
    pricingPolicy: {
      findFirst: vi.fn()
    },
    salesOrder: {
      update: vi.fn()
    },
    shelfJob: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn()
    },
    manufacturingPacket: {
      count: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("../modules/orderIntake/repository.js", () => repositoryMocks);
vi.mock("../modules/pricing/service.js", () => pricingServiceMocks);
vi.mock("../modules/settings/service.js", () => settingsMocks);
vi.mock("../lib/prisma.js", () => prismaMocks);

import { normalizeShelfOrderItem } from "../modules/orderIntake/normalizer.js";
import {
  convertShelfJobsToManufacturingPacket,
  createShelfJobsFromSalesOrder,
  priceSalesOrder
} from "../modules/orderIntake/service.js";

describe("order intake normalizer", () => {
  it("resolves shelf product defaults for a valid shelf line", () => {
    const result = normalizeShelfOrderItem({
      item: {
        id: "item_1",
        title: "White shelf",
        quantity: 2,
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: null,
        materialType: null,
        edgeBandPattern: null,
        requiresPackaging: true,
        shelfProductId: "shelf_product_1",
        packagingProfileId: null
      },
      shelfProduct: {
        id: "shelf_product_1",
        name: "3/4 White Melamine Shelf",
        materialType: "WHITE_MELAMINE",
        defaultThicknessIn: 0.75,
        defaultEdgeBandPattern: "ALL_FOUR",
        packagingProfileId: "packaging_1"
      },
      materialProfile: {
        thicknessIn: 0.75,
        defaultEdgeBandPattern: "ALL_FOUR"
      },
      defaultCostProfileId: "cost_profile_1",
      defaultProductionAssumptionProfileId: "production_profile_1",
      defaultPricingPolicyId: "pricing_policy_1"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedSpec.materialType).toBe("WHITE_MELAMINE");
      expect(result.normalizedSpec.edgeBandPattern).toBe("ALL_FOUR");
      expect(result.normalizedSpec.packagingProfileId).toBe("packaging_1");
    }
  });

  it("fails invalid shelf lines explicitly", () => {
    const result = normalizeShelfOrderItem({
      item: {
        id: "item_2",
        title: "Broken shelf",
        quantity: 0,
        lengthIn: 24,
        depthIn: null,
        thicknessIn: null,
        materialType: null,
        edgeBandPattern: null,
        requiresPackaging: true,
        shelfProductId: null,
        packagingProfileId: null
      },
      shelfProduct: null,
      materialProfile: null,
      defaultCostProfileId: "cost_profile_1",
      defaultProductionAssumptionProfileId: "production_profile_1",
      defaultPricingPolicyId: "pricing_policy_1"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Quantity must be greater than zero.");
      expect(result.errors).toContain("Valid depthIn is required.");
      expect(result.errors).toContain("Material type could not be resolved.");
    }
  });
});

describe("order intake service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.prisma.costProfile.findFirst.mockResolvedValue({ id: "cost_profile_1" });
    prismaMocks.prisma.productionAssumptionProfile.findFirst.mockResolvedValue({ id: "production_profile_1" });
    prismaMocks.prisma.pricingPolicy.findFirst.mockResolvedValue({ id: "pricing_policy_1" });
    prismaMocks.prisma.salesOrder.update.mockResolvedValue(undefined);
    prismaMocks.prisma.shelfJob.findFirst.mockResolvedValue(null);
    prismaMocks.prisma.manufacturingPacket.count.mockResolvedValue(0);
    prismaMocks.prisma.shelfJob.count.mockResolvedValue(0);
    prismaMocks.prisma.shelfJob.updateMany.mockResolvedValue({ count: 1 });
    prismaMocks.prisma.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === "function") {
        return arg({
          shelfJob: {
            count: prismaMocks.prisma.shelfJob.count,
            updateMany: prismaMocks.prisma.shelfJob.updateMany
          },
          salesOrder: {
            update: prismaMocks.prisma.salesOrder.update
          }
        });
      }
      return Promise.all(arg);
    });
    settingsMocks.getMaterialProfile.mockResolvedValue({
      thicknessIn: 0.75,
      defaultEdgeBandPattern: "ALL_FOUR"
    });
  });

  it("prices valid normalized items and records the pricing snapshot", async () => {
    repositoryMocks.getSalesOrderById
      .mockResolvedValueOnce({
        id: "sales_order_1",
        items: [
          {
            id: "item_valid",
            normalizationStatus: "NORMALIZED",
            pricingStatus: "PENDING",
            normalizedSpecJson: {
              shelfProductId: "shelf_product_1",
              costProfileId: "cost_profile_1",
              productionAssumptionProfileId: "production_profile_1",
              packagingProfileId: "packaging_1",
              pricingPolicyId: "pricing_policy_1",
              lengthIn: 30,
              depthIn: 12,
              thicknessIn: 0.75,
              quantity: 2,
              materialType: "WHITE_MELAMINE",
              edgeBandPattern: "ALL_FOUR",
              requiresPackaging: true
            }
          }
        ],
        shelfJobs: []
      })
      .mockResolvedValueOnce({
        id: "sales_order_1",
        items: [
          {
            id: "item_valid",
            normalizationStatus: "NORMALIZED",
            pricingStatus: "PRICED"
          }
        ],
        shelfJobs: []
      });

    pricingServiceMocks.createPricingScenarioSnapshot.mockResolvedValue({
      scenario: { id: "pricing_scenario_1" },
      result: { pricingBreakdown: { finalRunChargeCents: 40275 } }
    });

    await priceSalesOrder("sales_order_1", "org_local_craft_board", "user_1");

    expect(repositoryMocks.updateSalesOrderItem).toHaveBeenCalledWith(
      "item_valid",
      expect.objectContaining({
        pricingStatus: "PRICED",
        pricingSnapshotJson: expect.objectContaining({
          scenarioId: "pricing_scenario_1"
        })
      })
    );
  });

  it("creates shelf jobs from priced normalized items with source lineage", async () => {
    repositoryMocks.getSalesOrderById
      .mockResolvedValueOnce({
        id: "sales_order_1",
        items: [
          {
            id: "item_valid",
            pricingStatus: "PRICED",
            normalizationStatus: "NORMALIZED",
            normalizedSpecJson: {
              shelfProductId: "shelf_product_1",
              costProfileId: "cost_profile_1",
              productionAssumptionProfileId: "production_profile_1",
              packagingProfileId: "packaging_1",
              pricingPolicyId: "pricing_policy_1",
              quantity: 2
            },
            pricingSnapshotJson: { scenarioId: "pricing_scenario_1" }
          },
          {
            id: "item_invalid",
            pricingStatus: "HOLD",
            normalizationStatus: "HOLD",
            normalizedSpecJson: null,
            pricingSnapshotJson: null
          }
        ],
        shelfJobs: []
      })
      .mockResolvedValueOnce({
        id: "sales_order_1",
        items: [],
        shelfJobs: []
      });

    repositoryMocks.createShelfJob.mockResolvedValue({ id: "shelf_job_1" });

    const result = await createShelfJobsFromSalesOrder("sales_order_1", "org_local_craft_board");

    expect(result).toEqual({ ok: true, shelfJobIds: ["shelf_job_1"] });
    expect(repositoryMocks.createShelfJob).toHaveBeenCalledWith(
      expect.objectContaining({
        salesOrderId: "sales_order_1",
        salesOrderItemId: "item_valid",
        pricingScenarioId: "pricing_scenario_1"
      })
    );
  });

  it("converts only ready jobs into a manufacturing packet", async () => {
    prismaMocks.prisma.shelfJob.findMany.mockResolvedValue([
      {
        id: "shelf_job_1",
        salesOrderId: "sales_order_1",
        salesOrderItemId: "item_valid",
        quantity: 2,
        jobStatus: "READY",
        normalizedSpecJson: { materialType: "WHITE_MELAMINE" }
      }
    ]);
    repositoryMocks.createManufacturingPacket.mockResolvedValue({
      id: "packet_1",
      packetNumber: "MP-20260308-001",
      sourceType: "SHELF_JOB",
      sourceIdsJson: ["shelf_job_1"],
      summaryJson: { jobCount: 1 },
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await convertShelfJobsToManufacturingPacket({
      shelfJobIds: ["shelf_job_1"],
      organizationId: "org_local_craft_board",
      createdByUserId: "user_1"
    });

    expect(result.ok).toBe(true);
    expect(repositoryMocks.createManufacturingPacket).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "SHELF_JOB",
        sourceIdsJson: ["shelf_job_1"]
      })
    );
  });

  it("rejects packet conversion when selected jobs are not READY", async () => {
    prismaMocks.prisma.shelfJob.findMany.mockResolvedValue([
      {
        id: "shelf_job_1",
        salesOrderId: "sales_order_1",
        salesOrderItemId: "item_valid",
        quantity: 2,
        jobStatus: "CONVERTED_TO_MANUFACTURING",
        normalizedSpecJson: { materialType: "WHITE_MELAMINE" }
      }
    ]);

    await expect(
      convertShelfJobsToManufacturingPacket({
        shelfJobIds: ["shelf_job_1"],
        organizationId: "org_local_craft_board"
      })
    ).rejects.toThrow("No READY shelf jobs available for manufacturing packet conversion.");
  });
});

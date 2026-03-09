import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createCostProfile: vi.fn(),
  createCostScenario: vi.fn(),
  createOrderCostEstimate: vi.fn(),
  createShelfCostEstimate: vi.fn(),
  clearCurrentOrderCostEstimates: vi.fn(),
  clearCurrentShelfCostEstimates: vi.fn(),
  getCostProfileById: vi.fn(),
  getLatestOrderCostEstimate: vi.fn(),
  getLatestShelfCostEstimate: vi.fn(),
  getSalesOrderByIdForCosting: vi.fn(),
  getShelfJobByIdForCosting: vi.fn(),
  listActiveCostRates: vi.fn(),
  listCostProfiles: vi.fn(),
  updateCostProfile: vi.fn(),
  upsertCostRates: vi.fn()
}));

const settingsMocks = vi.hoisted(() => ({
  ensureDefaultProfiles: vi.fn(),
  getMaterialProfile: vi.fn()
}));

const pricingRepositoryMocks = vi.hoisted(() => ({
  getPackagingProfileById: vi.fn(),
  getPricingPolicyById: vi.fn(),
  getProductionAssumptionProfileById: vi.fn(),
  getShelfProductById: vi.fn()
}));

vi.mock("../modules/costing/repository.js", () => repositoryMocks);
vi.mock("../modules/settings/service.js", () => settingsMocks);
vi.mock("../modules/pricing/repository.js", () => pricingRepositoryMocks);

import { calculateShelfManufacturingCost } from "../modules/costing/calculator.js";
import {
  calculateCost,
  createCostScenarioSnapshot,
  getSalesOrderCostEstimate,
  getShelfJobCostEstimate,
  recomputeSalesOrderCostEstimate,
  recomputeShelfJobCostEstimate
} from "../modules/costing/service.js";

function buildRateMap(
  overrides: Partial<Record<string, { value: number; unit: string; effectiveFrom: string }>> = {}
) {
  return new Map(
    Object.entries({
      sheet_material_cost_per_sqft: { value: 2, unit: "usd_per_sqft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      edge_band_cost_per_linear_ft: { value: 0.5, unit: "usd_per_linear_ft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      glue_cost_per_linear_ft: { value: 0.1, unit: "usd_per_linear_ft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      cnc_machine_cost_per_min: { value: 1, unit: "usd_per_min", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      edgebander_cost_per_min: { value: 2, unit: "usd_per_min", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      labor_cost_per_min: { value: 0.5, unit: "usd_per_min", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      packaging_cost_per_unit: { value: 1, unit: "usd_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      packaging_cost_per_order: { value: 2, unit: "usd_per_order", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      shipping_allowance_per_unit: { value: 3, unit: "usd_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      shipping_allowance_per_order: { value: 4, unit: "usd_per_order", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      overhead_percent: { value: 10, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      growth_margin_percent: { value: 20, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      waste_percent: { value: 5, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      setup_minutes_per_run: { value: 6, unit: "minutes", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      handling_minutes_per_unit: { value: 2, unit: "minutes_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      packaging_minutes_per_unit: { value: 1, unit: "minutes_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      cnc_minutes_per_sqft: { value: 1.5, unit: "minutes_per_sqft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      edgebander_minutes_per_linear_ft: { value: 0.5, unit: "minutes_per_linear_ft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      ...overrides
    })
  );
}

describe("costing calculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates a golden shelf example with stable cent totals", () => {
    const result = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 24,
      depthIn: 12,
      quantity: 2,
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: true,
      rates: buildRateMap()
    });

    expect(result.geometry.totalSquareFeet).toBe(4);
    expect(result.geometry.totalEdgeBandLinearFeet).toBe(12);
    expect(result.breakdown.material.subtotalCents).toBe(840);
    expect(result.breakdown.edgeBand.subtotalCents).toBe(600);
    expect(result.breakdown.machine.subtotalCents).toBe(2400);
    expect(result.breakdown.directSubtotalCents).toBe(5660);
    expect(result.breakdown.overheadAmountCents).toBe(566);
    expect(result.breakdown.growthMarginAmountCents).toBe(1245);
    expect(result.breakdown.recommendedManufacturingChargeCents).toBe(6226);
    expect(result.breakdown.recommendedSellPriceCents).toBe(7471);
  });

  it("scales quantity runs while preserving per-order allowances", () => {
    const single = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 24,
      depthIn: 12,
      quantity: 1,
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: true,
      rates: buildRateMap()
    });
    const run = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 24,
      depthIn: 12,
      quantity: 5,
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: true,
      rates: buildRateMap()
    });

    expect(run.breakdown.directSubtotalCents).toBeGreaterThan(single.breakdown.directSubtotalCents * 3);
    expect(run.breakdown.packaging.subtotalCents).toBe(700);
    expect(run.breakdown.shippingAllowance.subtotalCents).toBe(1900);
  });

  it("changes edge band linear footage by pattern", () => {
    const none = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 30,
      depthIn: 12,
      quantity: 1,
      edgeBandPattern: "NONE",
      requiresPackaging: false,
      rates: buildRateMap()
    });
    const allFour = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 30,
      depthIn: 12,
      quantity: 1,
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: false,
      rates: buildRateMap()
    });

    expect(none.geometry.totalEdgeBandLinearFeet).toBe(0);
    expect(allFour.geometry.totalEdgeBandLinearFeet).toBe(7);
    expect(allFour.breakdown.edgeBand.subtotalCents).toBeGreaterThan(none.breakdown.edgeBand.subtotalCents);
  });

  it("applies waste factor to the material subtotal", () => {
    const noWaste = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 24,
      depthIn: 12,
      quantity: 2,
      edgeBandPattern: "NONE",
      requiresPackaging: false,
      rates: buildRateMap({
        waste_percent: { value: 0, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" }
      })
    });
    const waste = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 24,
      depthIn: 12,
      quantity: 2,
      edgeBandPattern: "NONE",
      requiresPackaging: false,
      rates: buildRateMap({
        waste_percent: { value: 10, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" }
      })
    });

    expect(noWaste.breakdown.material.subtotalCents).toBe(800);
    expect(waste.breakdown.material.subtotalCents).toBe(880);
  });

  it("applies overhead and growth margin after direct subtotal", () => {
    const result = calculateShelfManufacturingCost({
      profile: {
        id: "cost_profile_1",
        name: "Starter Shelf Cost Profile",
        currency: "USD",
        isDefault: true
      },
      costProfileId: "cost_profile_1",
      materialType: "WHITE_MELAMINE",
      lengthIn: 24,
      depthIn: 12,
      quantity: 2,
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: true,
      rates: buildRateMap()
    });

    expect(result.breakdown.overheadAmountCents).toBe(Math.round(result.breakdown.directSubtotalCents * 0.1));
    expect(result.breakdown.growthMarginAmountCents).toBe(
      Math.round(result.breakdown.recommendedManufacturingChargeCents * 0.2)
    );
  });

  it("fails explicitly when a required rate is missing", () => {
    const rates = buildRateMap();
    rates.delete("labor_cost_per_min");

    expect(() =>
      calculateShelfManufacturingCost({
        profile: {
          id: "cost_profile_1",
          name: "Starter Shelf Cost Profile",
          currency: "USD",
          isDefault: true
        },
        costProfileId: "cost_profile_1",
        materialType: "WHITE_MELAMINE",
        lengthIn: 24,
        depthIn: 12,
        quantity: 2,
        edgeBandPattern: "ALL_FOUR",
        requiresPackaging: true,
        rates
      })
    ).toThrow("Missing required cost rate: labor_cost_per_min.");
  });
});

describe("costing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockPricingContext() {
    repositoryMocks.getCostProfileById.mockResolvedValue({
      id: "cost_profile_1",
      name: "Starter Shelf Cost Profile",
      isDefault: true,
      currency: "USD",
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });
    repositoryMocks.listActiveCostRates.mockResolvedValue(
      Array.from(buildRateMap().entries()).map(([key, value]) => ({
        id: `${key}_1`,
        organizationId: "org_local_craft_board",
        costProfileId: "cost_profile_1",
        key,
        valueDecimal: value.value,
        unit: value.unit,
        notes: null,
        effectiveFrom: new Date(value.effectiveFrom),
        effectiveTo: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z")
      }))
    );
    settingsMocks.getMaterialProfile.mockResolvedValue({
      sheetWidthIn: 48,
      sheetDepthIn: 96
    });
    pricingRepositoryMocks.getProductionAssumptionProfileById.mockResolvedValue({
      id: "production_profile_1",
      name: "Starter Production",
      cncLoadMinutesPerRun: 4,
      cncUnloadMinutesPerRun: 2,
      cncRunMinutesPerUnit: 3,
      edgebanderSetupMinutesPerRun: 3,
      edgebanderRunMinutesPerLinearFt: 0.5,
      handlingMinutesPerUnit: 2,
      packagingMinutesPerUnit: 1,
      qcMinutesPerUnit: 0.5
    });
    pricingRepositoryMocks.getPricingPolicyById.mockResolvedValue({
      id: "pricing_policy_1",
      name: "Starter Policy",
      manufacturingMarkupPercent: 12,
      minimumChargeCentsPerUnit: 1500,
      minimumRunChargeCents: 0,
      roundingMode: "UP",
      roundToCents: 25
    });
    pricingRepositoryMocks.getShelfProductById.mockResolvedValue({
      id: "shelf_product_1",
      name: "3/4 White Melamine Shelf",
      code: "SHELF-WM-075"
    });
    pricingRepositoryMocks.getPackagingProfileById.mockResolvedValue({
      id: "packaging_1",
      name: "Starter Packaging",
      boxCostCentsPerUnit: 40,
      bubbleWrapCostCentsPerUnit: 15,
      shrinkWrapCostCentsPerUnit: 10,
      tapeCostCentsPerUnit: 8,
      labelCostCentsPerUnit: 5,
      insertFlyerCostCentsPerUnit: 2,
      otherPackagingCostCentsPerUnit: 4
    });
  }

  it("enforces org isolation for profile-owned calculations", async () => {
    repositoryMocks.getCostProfileById.mockResolvedValue(null);

    await expect(
      calculateCost(
        {
          costProfileId: "cost_profile_other",
          lengthIn: 24,
          depthIn: 12,
          quantity: 2,
          materialType: "WHITE_MELAMINE",
          edgeBandPattern: "ALL_FOUR",
          requiresPackaging: true
        },
        "org_local_craft_board"
      )
    ).rejects.toThrow("Cost profile not found.");
  });

  it("persists a scenario snapshot with the calculated result shape", async () => {
    mockPricingContext();
    repositoryMocks.createCostScenario.mockResolvedValue({
      id: "scenario_1",
      name: "Pilot shelf run",
      sourceType: "MANUAL",
      sourceId: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await createCostScenarioSnapshot(
      {
        name: "Pilot shelf run",
        sourceType: "MANUAL",
        input: {
          costProfileId: "cost_profile_1",
          lengthIn: 24,
          depthIn: 12,
          quantity: 2,
          materialType: "WHITE_MELAMINE",
          edgeBandPattern: "ALL_FOUR",
          requiresPackaging: true
        },
        createdByUserId: "user_1"
      },
      "org_local_craft_board"
    );

    expect(repositoryMocks.createCostScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        costProfileId: "cost_profile_1",
        createdByUserId: "user_1"
      })
    );
    expect(result.scenario.id).toBe("scenario_1");
    expect(result.result.breakdown.recommendedSellPriceCents).toBe(7471);
  });

  it("recomputes and persists a shelf-job estimate from canonical entities", async () => {
    mockPricingContext();
    repositoryMocks.getShelfJobByIdForCosting.mockResolvedValue({
      id: "shelf_job_1",
      organizationId: "org_local_craft_board",
      salesOrderId: "sales_order_1",
      salesOrderItemId: "item_1",
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
    });
    repositoryMocks.createShelfCostEstimate.mockResolvedValue({
      id: "shelf_estimate_1",
      estimateStatus: "COMPLETE",
      warningsJson: [],
      inputSnapshotJson: {
        costProfileId: "cost_profile_1"
      },
      assumptionSnapshotJson: {
        profilesUsed: {
          costProfile: {
            id: "cost_profile_1"
          }
        }
      },
      resultJson: {
        shelfJobId: "shelf_job_1",
        totalEstimatedCostCents: 9201
      },
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await recomputeShelfJobCostEstimate("shelf_job_1", "org_local_craft_board", "user_1");

    expect(repositoryMocks.clearCurrentShelfCostEstimates).toHaveBeenCalledWith(
      "shelf_job_1",
      "org_local_craft_board"
    );
    expect(repositoryMocks.createShelfCostEstimate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        shelfJobId: "shelf_job_1",
        salesOrderId: "sales_order_1",
        salesOrderItemId: "item_1",
        createdByUserId: "user_1",
        estimateStatus: "COMPLETE"
      })
    );
    expect(result.estimate.id).toBe("shelf_estimate_1");
    expect(result.estimate.result).toEqual({
      shelfJobId: "shelf_job_1",
      totalEstimatedCostCents: 9201
    });
  });

  it("returns the latest persisted shelf-job estimate", async () => {
    repositoryMocks.getLatestShelfCostEstimate.mockResolvedValue({
      id: "shelf_estimate_1",
      estimateStatus: "COMPLETE",
      warningsJson: [],
      inputSnapshotJson: { shelfJobId: "shelf_job_1" },
      assumptionSnapshotJson: { profilesUsed: {} },
      resultJson: { totalEstimatedCostCents: 9201 },
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await getShelfJobCostEstimate("shelf_job_1", "org_local_craft_board");

    expect(repositoryMocks.getLatestShelfCostEstimate).toHaveBeenCalledWith(
      "shelf_job_1",
      "org_local_craft_board"
    );
    expect(result.estimate.id).toBe("shelf_estimate_1");
  });

  it("aggregates sales-order estimates across canonical shelf jobs", async () => {
    mockPricingContext();
    repositoryMocks.getSalesOrderByIdForCosting.mockResolvedValue({
      id: "sales_order_1",
      organizationId: "org_local_craft_board",
      shelfJobs: [
        {
          id: "shelf_job_1",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_1",
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
        },
        {
          id: "shelf_job_2",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_2",
          normalizedSpecJson: {
            shelfProductId: "shelf_product_1",
            costProfileId: "cost_profile_1",
            productionAssumptionProfileId: "production_profile_1",
            packagingProfileId: "packaging_1",
            pricingPolicyId: "pricing_policy_1",
            lengthIn: 24,
            depthIn: 12,
            thicknessIn: 0.75,
            quantity: 1,
            materialType: "WHITE_MELAMINE",
            edgeBandPattern: "TWO_LONG_EDGES",
            requiresPackaging: false
          }
        }
      ]
    });
    repositoryMocks.createOrderCostEstimate.mockResolvedValue({
      id: "order_estimate_1",
      estimateStatus: "COMPLETE",
      warningsJson: [],
      inputSnapshotJson: { salesOrderId: "sales_order_1" },
      assumptionSnapshotJson: { lineAssumptions: [] },
      resultJson: {
        salesOrderId: "sales_order_1",
        totalEstimatedOrderCostCents: 12000
      },
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await recomputeSalesOrderCostEstimate("sales_order_1", "org_local_craft_board", "user_1");

    expect(repositoryMocks.clearCurrentOrderCostEstimates).toHaveBeenCalledWith(
      "sales_order_1",
      "org_local_craft_board"
    );
    expect(repositoryMocks.createOrderCostEstimate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        salesOrderId: "sales_order_1",
        createdByUserId: "user_1",
        estimateStatus: "COMPLETE"
      })
    );
    expect(result.estimate.id).toBe("order_estimate_1");
  });

  it("marks order estimates partial when one shelf job cannot be costed", async () => {
    mockPricingContext();
    repositoryMocks.getSalesOrderByIdForCosting.mockResolvedValue({
      id: "sales_order_1",
      organizationId: "org_local_craft_board",
      shelfJobs: [
        {
          id: "shelf_job_1",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_1",
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
        },
        {
          id: "shelf_job_bad",
          salesOrderId: "sales_order_1",
          salesOrderItemId: "item_bad",
          normalizedSpecJson: {
            shelfProductId: "shelf_product_1",
            costProfileId: "cost_profile_1",
            productionAssumptionProfileId: "production_profile_1",
            pricingPolicyId: "pricing_policy_1",
            lengthIn: 30,
            quantity: 1,
            materialType: "WHITE_MELAMINE",
            edgeBandPattern: "ALL_FOUR",
            requiresPackaging: true
          }
        }
      ]
    });
    repositoryMocks.createOrderCostEstimate.mockResolvedValue({
      id: "order_estimate_1",
      estimateStatus: "PARTIAL",
      warningsJson: ["ShelfJob shelf_job_bad: Shelf job shelf_job_bad is missing required field depthIn."],
      inputSnapshotJson: { salesOrderId: "sales_order_1" },
      assumptionSnapshotJson: { lineAssumptions: [] },
      resultJson: {
        salesOrderId: "sales_order_1",
        totalEstimatedOrderCostCents: 9000
      },
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    await recomputeSalesOrderCostEstimate("sales_order_1", "org_local_craft_board", "user_1");

    expect(repositoryMocks.createOrderCostEstimate).toHaveBeenCalledWith(
      expect.objectContaining({
        estimateStatus: "PARTIAL",
        warningsJson: expect.arrayContaining([
          expect.stringContaining("shelf_job_bad")
        ])
      })
    );
  });

  it("returns the latest persisted sales-order estimate", async () => {
    repositoryMocks.getLatestOrderCostEstimate.mockResolvedValue({
      id: "order_estimate_1",
      estimateStatus: "COMPLETE",
      warningsJson: [],
      inputSnapshotJson: { salesOrderId: "sales_order_1" },
      assumptionSnapshotJson: { lineAssumptions: [] },
      resultJson: { totalEstimatedOrderCostCents: 12000 },
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await getSalesOrderCostEstimate("sales_order_1", "org_local_craft_board");

    expect(repositoryMocks.getLatestOrderCostEstimate).toHaveBeenCalledWith(
      "sales_order_1",
      "org_local_craft_board"
    );
    expect(result.estimate.id).toBe("order_estimate_1");
  });
});

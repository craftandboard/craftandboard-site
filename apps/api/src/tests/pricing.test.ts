import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateShelfPricing } from "../modules/pricing/calculator.js";

const pricingRepositoryMocks = vi.hoisted(() => ({
  createPackagingProfile: vi.fn(),
  createPricingPolicy: vi.fn(),
  createPricingScenario: vi.fn(),
  createProductionAssumptionProfile: vi.fn(),
  createShelfProduct: vi.fn(),
  getPackagingProfileById: vi.fn(),
  getPricingPolicyById: vi.fn(),
  getProductionAssumptionProfileById: vi.fn(),
  getShelfProductById: vi.fn(),
  listPackagingProfiles: vi.fn(),
  listPricingPolicies: vi.fn(),
  listProductionAssumptionProfiles: vi.fn(),
  listShelfProducts: vi.fn(),
  updatePackagingProfile: vi.fn(),
  updatePricingPolicy: vi.fn(),
  updateProductionAssumptionProfile: vi.fn(),
  updateShelfProduct: vi.fn()
}));

const settingsMocks = vi.hoisted(() => ({
  ensureDefaultProfiles: vi.fn(),
  getMaterialProfile: vi.fn()
}));

const costingServiceMocks = vi.hoisted(() => ({
  ensureCostProfileOwnership: vi.fn(),
  latestRatesByKey: vi.fn()
}));

const costingRepositoryMocks = vi.hoisted(() => ({
  listActiveCostRates: vi.fn()
}));

vi.mock("../modules/pricing/repository.js", () => pricingRepositoryMocks);
vi.mock("../modules/settings/service.js", () => settingsMocks);
vi.mock("../modules/costing/service.js", () => costingServiceMocks);
vi.mock("../modules/costing/repository.js", () => costingRepositoryMocks);

import { calculatePricing, createPricingScenarioSnapshot } from "../modules/pricing/service.js";

function buildRateMap(
  overrides: Partial<Record<string, { value: number; unit: string; effectiveFrom: string }>> = {}
) {
  return new Map(
    Object.entries({
      sheet_material_cost_per_sqft: { value: 2.85, unit: "usd_per_sqft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      edge_band_cost_per_linear_ft: { value: 0.18, unit: "usd_per_linear_ft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      glue_cost_per_linear_ft: { value: 0.03, unit: "usd_per_linear_ft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      cnc_machine_cost_per_min: { value: 0.85, unit: "usd_per_min", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      edgebander_cost_per_min: { value: 0.62, unit: "usd_per_min", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      labor_cost_per_min: { value: 0.55, unit: "usd_per_min", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      packaging_cost_per_order: { value: 1.5, unit: "usd_per_order", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      shipping_allowance_per_unit: { value: 0.75, unit: "usd_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      shipping_allowance_per_order: { value: 2.25, unit: "usd_per_order", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      overhead_percent: { value: 12, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      growth_margin_percent: { value: 18, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      waste_percent: { value: 9, unit: "percent", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      setup_minutes_per_run: { value: 10, unit: "minutes", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      handling_minutes_per_unit: { value: 1.75, unit: "minutes_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      packaging_minutes_per_unit: { value: 0.8, unit: "minutes_per_unit", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      cnc_minutes_per_sqft: { value: 1.4, unit: "minutes_per_sqft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      edgebander_minutes_per_linear_ft: { value: 0.35, unit: "minutes_per_linear_ft", effectiveFrom: "2026-01-01T00:00:00.000Z" },
      ...overrides
    })
  );
}

describe("pricing calculator", () => {
  it("quantity materially changes unit pricing through setup allocation", () => {
    const single = calculateShelfPricing({
      normalizedInput: {
        costProfileId: "cost_profile_1",
        productionAssumptionProfileId: "production_profile_1",
        pricingPolicyId: "pricing_policy_1",
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.75,
        quantity: 1,
        materialType: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        requiresPackaging: true
      },
      costProfile: { id: "cost_profile_1", name: "Starter", currency: "USD", isDefault: true },
      productionAssumptionProfile: {
        id: "production_profile_1",
        name: "Standard",
        cncLoadMinutesPerRun: 6,
        cncUnloadMinutesPerRun: 4,
        cncRunMinutesPerUnit: 2.8,
        edgebanderSetupMinutesPerRun: 7,
        edgebanderRunMinutesPerLinearFt: 0.35,
        handlingMinutesPerUnit: 1.75,
        packagingMinutesPerUnit: 0.8,
        qcMinutesPerUnit: 0.4
      },
      packagingProfile: {
        id: "packaging_1",
        name: "Starter Packaging",
        boxCostCentsPerUnit: 65,
        bubbleWrapCostCentsPerUnit: 10,
        shrinkWrapCostCentsPerUnit: 5,
        tapeCostCentsPerUnit: 4,
        labelCostCentsPerUnit: 6,
        insertFlyerCostCentsPerUnit: 3,
        otherPackagingCostCentsPerUnit: 2
      },
      pricingPolicy: {
        id: "pricing_policy_1",
        name: "Standard Policy",
        manufacturingMarkupPercent: 12,
        minimumChargeCentsPerUnit: 2400,
        minimumRunChargeCents: 12000,
        roundingMode: "UP",
        roundToCents: 25
      },
      materialProfile: { sheetWidthIn: 48, sheetDepthIn: 96 },
      baseRates: buildRateMap()
    });
    const run = calculateShelfPricing({
      normalizedInput: {
        costProfileId: "cost_profile_1",
        productionAssumptionProfileId: "production_profile_1",
        pricingPolicyId: "pricing_policy_1",
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.75,
        quantity: 20,
        materialType: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        requiresPackaging: true
      },
      costProfile: { id: "cost_profile_1", name: "Starter", currency: "USD", isDefault: true },
      productionAssumptionProfile: {
        id: "production_profile_1",
        name: "Standard",
        cncLoadMinutesPerRun: 6,
        cncUnloadMinutesPerRun: 4,
        cncRunMinutesPerUnit: 2.8,
        edgebanderSetupMinutesPerRun: 7,
        edgebanderRunMinutesPerLinearFt: 0.35,
        handlingMinutesPerUnit: 1.75,
        packagingMinutesPerUnit: 0.8,
        qcMinutesPerUnit: 0.4
      },
      packagingProfile: {
        id: "packaging_1",
        name: "Starter Packaging",
        boxCostCentsPerUnit: 65,
        bubbleWrapCostCentsPerUnit: 10,
        shrinkWrapCostCentsPerUnit: 5,
        tapeCostCentsPerUnit: 4,
        labelCostCentsPerUnit: 6,
        insertFlyerCostCentsPerUnit: 3,
        otherPackagingCostCentsPerUnit: 2
      },
      pricingPolicy: {
        id: "pricing_policy_1",
        name: "Standard Policy",
        manufacturingMarkupPercent: 12,
        minimumChargeCentsPerUnit: 2400,
        minimumRunChargeCents: 12000,
        roundingMode: "UP",
        roundToCents: 25
      },
      materialProfile: { sheetWidthIn: 48, sheetDepthIn: 96 },
      baseRates: buildRateMap()
    });

    expect(run.quantityAnalysis.unitChargeCents).toBeLessThan(single.quantityAnalysis.unitChargeCents);
  });

  it("includes packaging profile contribution in pricing output", () => {
    const result = calculateShelfPricing({
      normalizedInput: {
        costProfileId: "cost_profile_1",
        productionAssumptionProfileId: "production_profile_1",
        pricingPolicyId: "pricing_policy_1",
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.75,
        quantity: 2,
        materialType: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        requiresPackaging: true
      },
      costProfile: { id: "cost_profile_1", name: "Starter", currency: "USD", isDefault: true },
      productionAssumptionProfile: {
        id: "production_profile_1",
        name: "Standard",
        cncLoadMinutesPerRun: 6,
        cncUnloadMinutesPerRun: 4,
        cncRunMinutesPerUnit: 2.8,
        edgebanderSetupMinutesPerRun: 7,
        edgebanderRunMinutesPerLinearFt: 0.35,
        handlingMinutesPerUnit: 1.75,
        packagingMinutesPerUnit: 0.8,
        qcMinutesPerUnit: 0.4
      },
      packagingProfile: {
        id: "packaging_1",
        name: "Starter Packaging",
        boxCostCentsPerUnit: 65,
        bubbleWrapCostCentsPerUnit: 10,
        shrinkWrapCostCentsPerUnit: 5,
        tapeCostCentsPerUnit: 4,
        labelCostCentsPerUnit: 6,
        insertFlyerCostCentsPerUnit: 3,
        otherPackagingCostCentsPerUnit: 2
      },
      pricingPolicy: {
        id: "pricing_policy_1",
        name: "Standard Policy",
        manufacturingMarkupPercent: 12,
        minimumChargeCentsPerUnit: 2400,
        minimumRunChargeCents: 12000,
        roundingMode: "UP",
        roundToCents: 25
      },
      materialProfile: { sheetWidthIn: 48, sheetDepthIn: 96 },
      baseRates: buildRateMap()
    });

    expect(result.costBreakdown.packaging.subtotalCents).toBeGreaterThan(0);
  });

  it("applies markup, minimum run charge, and rounding deterministically", () => {
    const result = calculateShelfPricing({
      normalizedInput: {
        costProfileId: "cost_profile_1",
        productionAssumptionProfileId: "production_profile_1",
        pricingPolicyId: "pricing_policy_1",
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.75,
        quantity: 1,
        materialType: "WHITE_MELAMINE",
        edgeBandPattern: "ALL_FOUR",
        requiresPackaging: true
      },
      costProfile: { id: "cost_profile_1", name: "Starter", currency: "USD", isDefault: true },
      productionAssumptionProfile: {
        id: "production_profile_1",
        name: "Standard",
        cncLoadMinutesPerRun: 6,
        cncUnloadMinutesPerRun: 4,
        cncRunMinutesPerUnit: 2.8,
        edgebanderSetupMinutesPerRun: 7,
        edgebanderRunMinutesPerLinearFt: 0.35,
        handlingMinutesPerUnit: 1.75,
        packagingMinutesPerUnit: 0.8,
        qcMinutesPerUnit: 0.4
      },
      packagingProfile: {
        id: "packaging_1",
        name: "Starter Packaging",
        boxCostCentsPerUnit: 65,
        bubbleWrapCostCentsPerUnit: 10,
        shrinkWrapCostCentsPerUnit: 5,
        tapeCostCentsPerUnit: 4,
        labelCostCentsPerUnit: 6,
        insertFlyerCostCentsPerUnit: 3,
        otherPackagingCostCentsPerUnit: 2
      },
      pricingPolicy: {
        id: "pricing_policy_1",
        name: "Standard Policy",
        manufacturingMarkupPercent: 12,
        minimumChargeCentsPerUnit: 2400,
        minimumRunChargeCents: 12000,
        roundingMode: "UP",
        roundToCents: 25
      },
      materialProfile: { sheetWidthIn: 48, sheetDepthIn: 96 },
      baseRates: buildRateMap()
    });

    expect(result.pricingBreakdown.policyMarkupAmountCents).toBeGreaterThan(0);
    expect(result.pricingBreakdown.finalRunChargeCents).toBeGreaterThanOrEqual(12000);
    expect(result.pricingBreakdown.finalRunChargeCents % 25).toBe(0);
  });
});

describe("pricing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsMocks.ensureDefaultProfiles.mockResolvedValue(undefined);
    costingServiceMocks.ensureCostProfileOwnership.mockResolvedValue({
      id: "cost_profile_1",
      name: "Starter Cost Profile",
      currency: "USD",
      isDefault: true
    });
    costingServiceMocks.latestRatesByKey.mockImplementation((rates) => rates);
    costingRepositoryMocks.listActiveCostRates.mockResolvedValue(buildRateMap());
    settingsMocks.getMaterialProfile.mockResolvedValue({
      sheetWidthIn: 48,
      sheetDepthIn: 96
    });
  });

  it("resolves shelf product defaults and allows explicit thickness override", async () => {
    pricingRepositoryMocks.getShelfProductById.mockResolvedValue({
      id: "shelf_product_1",
      name: "3/4 White Melamine Shelf",
      code: "SHELF-WM-075",
      materialType: "WHITE_MELAMINE",
      defaultThicknessIn: 0.75,
      defaultEdgeBandPattern: "ALL_FOUR",
      packagingProfileId: "packaging_1"
    });
    pricingRepositoryMocks.getProductionAssumptionProfileById.mockResolvedValue({
      id: "production_profile_1",
      name: "Standard",
      cncLoadMinutesPerRun: 6,
      cncUnloadMinutesPerRun: 4,
      cncRunMinutesPerUnit: 2.8,
      edgebanderSetupMinutesPerRun: 7,
      edgebanderRunMinutesPerLinearFt: 0.35,
      handlingMinutesPerUnit: 1.75,
      packagingMinutesPerUnit: 0.8,
      qcMinutesPerUnit: 0.4
    });
    pricingRepositoryMocks.getPricingPolicyById.mockResolvedValue({
      id: "pricing_policy_1",
      name: "Standard",
      manufacturingMarkupPercent: 12,
      minimumChargeCentsPerUnit: 2400,
      minimumRunChargeCents: 12000,
      roundingMode: "UP",
      roundToCents: 25
    });
    pricingRepositoryMocks.getPackagingProfileById.mockResolvedValue({
      id: "packaging_1",
      name: "Starter Packaging",
      boxCostCentsPerUnit: 65,
      bubbleWrapCostCentsPerUnit: 10,
      shrinkWrapCostCentsPerUnit: 5,
      tapeCostCentsPerUnit: 4,
      labelCostCentsPerUnit: 6,
      insertFlyerCostCentsPerUnit: 3,
      otherPackagingCostCentsPerUnit: 2
    });

    const result = await calculatePricing(
      {
        shelfProductId: "shelf_product_1",
        costProfileId: "cost_profile_1",
        productionAssumptionProfileId: "production_profile_1",
        pricingPolicyId: "pricing_policy_1",
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.875,
        quantity: 20,
        requiresPackaging: true
      },
      "org_local_craft_board",
      "user_1"
    );

    expect(result.result.normalizedInput.materialType).toBe("WHITE_MELAMINE");
    expect(result.result.normalizedInput.edgeBandPattern).toBe("ALL_FOUR");
    expect(result.result.normalizedInput.thicknessIn).toBe(0.875);
  });

  it("enforces org isolation for owned profiles", async () => {
    pricingRepositoryMocks.getProductionAssumptionProfileById.mockResolvedValue({
      id: "production_profile_1",
      name: "Standard",
      cncLoadMinutesPerRun: 6,
      cncUnloadMinutesPerRun: 4,
      cncRunMinutesPerUnit: 2.8,
      edgebanderSetupMinutesPerRun: 7,
      edgebanderRunMinutesPerLinearFt: 0.35,
      handlingMinutesPerUnit: 1.75,
      packagingMinutesPerUnit: 0.8,
      qcMinutesPerUnit: 0.4
    });
    pricingRepositoryMocks.getPricingPolicyById.mockResolvedValue({
      id: "pricing_policy_1",
      name: "Standard",
      manufacturingMarkupPercent: 12,
      minimumChargeCentsPerUnit: 2400,
      minimumRunChargeCents: 12000,
      roundingMode: "UP",
      roundToCents: 25
    });
    costingServiceMocks.ensureCostProfileOwnership.mockRejectedValue(new Error("Cost profile not found."));

    await expect(
      calculatePricing(
        {
          costProfileId: "cost_profile_other",
          productionAssumptionProfileId: "production_profile_1",
          pricingPolicyId: "pricing_policy_1",
          lengthIn: 30,
          depthIn: 12,
          quantity: 20,
          materialType: "WHITE_MELAMINE",
          edgeBandPattern: "ALL_FOUR",
          requiresPackaging: false
        },
        "org_local_craft_board",
        "user_1"
      )
    ).rejects.toThrow("Cost profile not found.");
  });

  it("persists pricing scenario snapshots with result shape", async () => {
    pricingRepositoryMocks.getProductionAssumptionProfileById.mockResolvedValue({
      id: "production_profile_1",
      name: "Standard",
      cncLoadMinutesPerRun: 6,
      cncUnloadMinutesPerRun: 4,
      cncRunMinutesPerUnit: 2.8,
      edgebanderSetupMinutesPerRun: 7,
      edgebanderRunMinutesPerLinearFt: 0.35,
      handlingMinutesPerUnit: 1.75,
      packagingMinutesPerUnit: 0.8,
      qcMinutesPerUnit: 0.4
    });
    pricingRepositoryMocks.getPricingPolicyById.mockResolvedValue({
      id: "pricing_policy_1",
      name: "Standard",
      manufacturingMarkupPercent: 12,
      minimumChargeCentsPerUnit: 2400,
      minimumRunChargeCents: 12000,
      roundingMode: "UP",
      roundToCents: 25
    });
    pricingRepositoryMocks.createPricingScenario.mockResolvedValue({
      id: "pricing_scenario_1",
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await createPricingScenarioSnapshot(
      {
        costProfileId: "cost_profile_1",
        productionAssumptionProfileId: "production_profile_1",
        pricingPolicyId: "pricing_policy_1",
        sourceType: "MANUAL",
        input: {
          costProfileId: "cost_profile_1",
          productionAssumptionProfileId: "production_profile_1",
          pricingPolicyId: "pricing_policy_1",
          lengthIn: 30,
          depthIn: 12,
          quantity: 20,
          materialType: "WHITE_MELAMINE",
          edgeBandPattern: "ALL_FOUR",
          requiresPackaging: false
        },
        createdByUserId: "user_1"
      },
      "org_local_craft_board"
    );

    expect(pricingRepositoryMocks.createPricingScenario).toHaveBeenCalled();
    expect(result.scenario.id).toBe("pricing_scenario_1");
    expect(result.result.pricingBreakdown.finalRunChargeCents).toBeGreaterThan(0);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createAmazonFeePresetRecord: vi.fn(),
  createCalculationComparisonSetRecord: vi.fn(),
  createCalculationScenarioRecord: vi.fn(),
  createComparisonSetScenarioRecord: vi.fn(),
  createCostProfileRecord: vi.fn(),
  createEdgeBandCostRuleRecord: vi.fn(),
  createLaunchGuardrailProfileRecord: vi.fn(),
  createLaunchTemplateRecord: vi.fn(),
  createMaterialCostRuleRecord: vi.fn(),
  createPackagingCostRuleRecord: vi.fn(),
  createShelfCostCalculationRecord: vi.fn(),
  createShippingCostRuleRecord: vi.fn(),
  createShippingZoneRuleRecord: vi.fn(),
  getAmazonFeePresetRecord: vi.fn(),
  getCalculationComparisonSetRecord: vi.fn(),
  getCostProfileRecord: vi.fn(),
  getLaunchGuardrailProfileRecord: vi.fn(),
  getLaunchTemplateRecord: vi.fn(),
  getShelfCostCalculationRecord: vi.fn(),
  getShippingZoneRuleRecord: vi.fn(),
  listAmazonFeePresetsForOrganization: vi.fn(),
  listCalculationComparisonSetsForOrganization: vi.fn(),
  listCostProfilesForOrganization: vi.fn(),
  listLaunchGuardrailProfilesForOrganization: vi.fn(),
  listLaunchTemplatesForOrganization: vi.fn(),
  listShelfCostCalculationsForOrganization: vi.fn(),
  listShippingZoneRulesForOrganization: vi.fn(),
  updateAmazonFeePresetRecord: vi.fn(),
  updateCostProfileRecord: vi.fn(),
  updateEdgeBandCostRuleRecord: vi.fn(),
  updateCalculationComparisonSetRecord: vi.fn(),
  updateCalculationScenarioRecord: vi.fn(),
  updateLaunchGuardrailProfileRecord: vi.fn(),
  updateLaunchTemplateRecord: vi.fn(),
  updateMaterialCostRuleRecord: vi.fn(),
  updatePackagingCostRuleRecord: vi.fn(),
  updateShippingCostRuleRecord: vi.fn(),
  updateShippingZoneRuleRecord: vi.fn()
}));

vi.mock("../modules/costEngine/repository.js", () => repositoryMocks);

import {
  calculateShelfCostView,
  compareShelfCostScenarios,
  createLaunchGuardrailProfile,
  createLaunchTemplate,
  evaluateComparisonSetListingReadiness,
  getComparisonSetExportSummary,
  getShelfCostCalculation,
  listLaunchGuardrailProfiles,
  rankComparisonSet,
  listCostProfiles,
  listLaunchTemplates,
  saveComparisonSet,
  saveShelfCostCalculation
} from "../modules/costEngine/service.js";

function makeProfile() {
  return {
    id: "profile_1",
    organizationId: "org_local_craft_board",
    name: "Hugo Base",
    status: "ACTIVE",
    isDefault: true,
    currency: "USD",
    defaultMaterialWastePct: { toNumber: () => 10 },
    defaultEdgeBandWastePct: { toNumber: () => 8 },
    defaultLaborRateCentsPerHour: 4500,
    defaultMachineRateCentsPerHour: 7200,
    defaultOverheadRateCentsPerHour: 1800,
    defaultPackagingAllowanceCents: 0,
    defaultShippingAllowanceCents: 0,
    defaultPackingLaborRateCentsPerHour: 4200,
    defaultPackingMinutes: { toNumber: () => 6 },
    defaultMarketplaceFeePct: { toNumber: () => 15 },
    defaultReturnReservePct: { toNumber: () => 2 },
    defaultDamageReservePct: { toNumber: () => 1 },
    defaultShippingBufferPct: { toNumber: () => 5 },
    defaultShippingBufferCents: 0,
    defaultPackagingOverheadCents: 25,
    defaultRecommendedMinMarginPct: { toNumber: () => 10 },
    defaultRecommendedTargetMarginPct: { toNumber: () => 20 },
    targetMarginPct: { toNumber: () => 20 },
    growthMarginPct: { toNumber: () => 10 },
    notes: null,
    metadata: null,
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    materialCostRules: [
      {
        id: "material_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        materialCode: "WHITE_MELAMINE_075",
        materialName: "White Melamine 3/4",
        thicknessLabel: '3/4"',
        sheetLengthIn: { toNumber: () => 96 },
        sheetWidthIn: { toNumber: () => 48 },
        sheetCostCents: 6500,
        usableYieldPct: { toNumber: () => 92 },
        wastePct: { toNumber: () => 8 },
        active: true,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    edgeBandCostRules: [
      {
        id: "edge_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        edgeBandCode: "PVC_WHITE",
        edgeBandName: "White PVC",
        costCentsPerLinearFoot: 45,
        wastePct: { toNumber: () => 5 },
        setupAllowanceLinearFt: { toNumber: () => 1 },
        active: true,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    packagingCostRules: [
      {
        id: "pack_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        packagingCode: "STANDARD",
        packagingName: "Standard",
        boxCostCents: 140,
        bubbleWrapCostCents: 55,
        tapeCostCents: 20,
        labelCostCents: 10,
        insertFlyerCostCents: 5,
        shrinkWrapCostCents: 0,
        foamCostCents: 40,
        cornerProtectorCostCents: 16,
        packingMinutes: { toNumber: () => 7 },
        packingLaborOverrideCents: null,
        packagingOverheadCents: 15,
        otherPackagingCostCents: 0,
        sortOrder: 1,
        active: true,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    shippingCostRules: [
      {
        id: "ship_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        shippingCode: "GROUND",
        shippingName: "Ground",
        baseCostCents: 1295,
        costPerPoundCents: null,
        costPerCubicInchCents: 0.1,
        dimensionalDivisor: { toNumber: () => 139 },
        dimensionalRateCents: 14,
        shippingBufferPct: { toNumber: () => 6 },
        shippingBufferCents: 45,
        marketplaceHandlingCents: 35,
        sortOrder: 1,
        flatOverride: null,
        active: true,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    amazonFeePresets: [
      {
        id: "preset_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        name: "Amazon Standard",
        status: "ACTIVE",
        referralFeePct: { toNumber: () => 15 },
        closingFeeCents: 99,
        fulfillmentFeeCents: 450,
        storageAllowanceCents: 40,
        advertisingAllowancePct: { toNumber: () => 8 },
        advertisingAllowanceCents: 0,
        returnReservePct: { toNumber: () => 2 },
        returnReserveCents: 0,
        damageReservePct: { toNumber: () => 1 },
        damageReserveCents: 0,
        miscMarketplacePct: { toNumber: () => 0.5 },
        miscMarketplaceCents: 0,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    shippingZoneRules: [
      {
        id: "zone_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        name: "Zone 2",
        zoneCode: "Z2",
        status: "ACTIVE",
        baseCostCents: 250,
        weightAdderCents: 10,
        dimensionalAdderCents: 5,
        bufferPct: { toNumber: () => 4 },
        bufferCents: 25,
        marketplaceHandlingCents: 15,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    launchTemplates: [],
    launchGuardrailProfiles: []
  };
}

describe("cost engine service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getCostProfileRecord.mockResolvedValue(makeProfile());
    repositoryMocks.listCostProfilesForOrganization.mockResolvedValue([makeProfile()]);
    repositoryMocks.updateCalculationScenarioRecord.mockResolvedValue({ count: 1 });
    repositoryMocks.updateCalculationComparisonSetRecord.mockResolvedValue({ count: 1 });
    repositoryMocks.getLaunchGuardrailProfileRecord.mockResolvedValue(null);
  });

  it("lists cost profiles in org scope", async () => {
    const payload = await listCostProfiles({ organizationId: "org_local_craft_board" });
    expect(payload.profiles).toHaveLength(1);
    expect(payload.profiles[0]?.name).toBe("Hugo Base");
  });

  it("calculates a shelf cost breakdown with richer packaging, shipping, and pricing outputs", async () => {
    const payload = await calculateShelfCostView({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      quantity: 2,
      lengthIn: 30,
      depthIn: 12,
      thicknessIn: 0.75,
      materialCode: "WHITE_MELAMINE_075",
      edgeBandCode: "PVC_WHITE",
      edgeBandPattern: "LONG_EDGES",
      packagingCode: "STANDARD",
      shippingCode: "GROUND",
      amazonFeePresetId: "preset_1",
      shippingZoneRuleId: "zone_1",
      laborMinutes: 12,
      machineMinutes: 8,
      overheadMinutes: 10,
      packingMinutes: 9,
      marketplaceFeePct: 15,
      returnReservePct: 2,
      damageReservePct: 1,
      shippingBufferPct: 8
    });

    expect(payload.calculation.materialCostCents).toBeGreaterThan(0);
    expect(payload.calculation.edgeBandCostCents).toBeGreaterThan(0);
    expect(payload.calculation.packagingCostCents).toBeGreaterThan(0);
    expect(payload.calculation.packingLaborCostCents).toBeGreaterThan(0);
    expect(payload.calculation.shippingCostCents).toBeGreaterThanOrEqual(1295);
    expect(payload.calculation.shippingBufferCostCents).toBeGreaterThan(0);
    expect(payload.calculation.marketplaceFeeCostCents).toBeGreaterThan(0);
    expect(payload.calculation.referralFeeCostCents).toBeGreaterThan(0);
    expect(payload.calculation.fulfillmentFeeCostCents).toBe(450);
    expect(payload.calculation.breakEvenPriceCents).toBeGreaterThan(
      payload.calculation.subtotalCostCents
    );
    expect(payload.calculation.recommendedMinSellPriceCents).toBeGreaterThan(
      payload.calculation.breakEvenPriceCents
    );
    expect(payload.calculation.recommendedTargetSellPriceCents).toBeGreaterThan(
      payload.calculation.recommendedMinSellPriceCents
    );
    expect(payload.calculation.recommendedSellPriceCents).toBeGreaterThan(
      payload.calculation.subtotalCostCents
    );
    expect(payload.result.shipping.shippingZoneCode).toBe("Z2");
    expect(payload.result.amazonFees.presetName).toBe("Amazon Standard");
  });

  it("compares scenarios and returns side-by-side deltas", async () => {
    const payload = await compareShelfCostScenarios({
      organizationId: "org_local_craft_board",
      baseSpec: {
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        quantity: 1,
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.75,
        materialCode: "WHITE_MELAMINE_075",
        edgeBandCode: "PVC_WHITE",
        edgeBandPattern: "LONG_EDGES",
        packagingCode: "STANDARD",
        shippingCode: "GROUND",
        laborMinutes: 12,
        machineMinutes: 8
      },
      scenarios: [
        { name: "Baseline", amazonFeePresetId: "preset_1" },
        { name: "Farther Zone", amazonFeePresetId: "preset_1", shippingZoneRuleId: "zone_1" }
      ]
    });

    expect(payload.comparison.scenarios).toHaveLength(2);
    expect(payload.comparison.scenarios[1]?.deltas.breakEvenPriceCents).not.toBe(0);
    expect(payload.comparison.ranking?.recommendation?.recommendedScenarioId).toBeTruthy();
  });

  it("creates and lists launch templates", async () => {
    repositoryMocks.createLaunchTemplateRecord.mockResolvedValueOnce({ id: "template_1" });
    repositoryMocks.getLaunchTemplateRecord.mockResolvedValueOnce({
      id: "template_1",
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Balanced launch",
      status: "ACTIVE",
      defaultAmazonFeePresetId: "preset_1",
      defaultAmazonFeePreset: { name: "Amazon Standard" },
      defaultShippingZoneRuleId: "zone_1",
      defaultShippingZoneRule: { name: "Zone 2" },
      defaultPackagingRuleId: null,
      defaultPackagingRule: null,
      defaultShippingRuleId: null,
      defaultShippingRule: null,
      launchStrategy: "BALANCED",
      notes: null,
      assumptionsSnapshot: {},
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });
    repositoryMocks.listLaunchTemplatesForOrganization.mockResolvedValueOnce([
      {
        id: "template_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        name: "Balanced launch",
        status: "ACTIVE",
        defaultAmazonFeePresetId: "preset_1",
        defaultAmazonFeePreset: { name: "Amazon Standard" },
        defaultShippingZoneRuleId: "zone_1",
        defaultShippingZoneRule: { name: "Zone 2" },
        defaultPackagingRuleId: null,
        defaultPackagingRule: null,
        defaultShippingRuleId: null,
        defaultShippingRule: null,
        launchStrategy: "BALANCED",
        notes: null,
        assumptionsSnapshot: {},
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]);

    const created = await createLaunchTemplate({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Balanced launch",
      launchStrategy: "BALANCED"
    });
    expect(created.launchTemplate.name).toBe("Balanced launch");

    const listed = await listLaunchTemplates({ organizationId: "org_local_craft_board" });
    expect(listed.launchTemplates).toHaveLength(1);
  });

  it("creates and lists launch guardrail profiles", async () => {
    repositoryMocks.createLaunchGuardrailProfileRecord.mockResolvedValueOnce({ id: "guard_1" });
    repositoryMocks.getLaunchGuardrailProfileRecord.mockResolvedValueOnce({
      id: "guard_1",
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Balanced guardrails",
      status: "ACTIVE",
      minimumMarginPct: { toNumber: () => 20 },
      minimumBufferAboveBreakEvenPct: { toNumber: () => 10 },
      maximumFeeBurdenPct: { toNumber: () => 28 },
      maximumShippingBurdenPct: { toNumber: () => 18 },
      maximumReserveBurdenPct: { toNumber: () => 8 },
      maximumAllowedTargetToFloorGapPct: { toNumber: () => 20 },
      notes: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });
    repositoryMocks.listLaunchGuardrailProfilesForOrganization.mockResolvedValueOnce([
      {
        id: "guard_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        name: "Balanced guardrails",
        status: "ACTIVE",
        minimumMarginPct: { toNumber: () => 20 },
        minimumBufferAboveBreakEvenPct: { toNumber: () => 10 },
        maximumFeeBurdenPct: { toNumber: () => 28 },
        maximumShippingBurdenPct: { toNumber: () => 18 },
        maximumReserveBurdenPct: { toNumber: () => 8 },
        maximumAllowedTargetToFloorGapPct: { toNumber: () => 20 },
        notes: null,
        metadata: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]);

    const created = await createLaunchGuardrailProfile({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Balanced guardrails",
      minimumMarginPct: 20
    });
    const listed = await listLaunchGuardrailProfiles({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1"
    });

    expect(created.launchGuardrailProfile.id).toBe("guard_1");
    expect(listed.launchGuardrailProfiles).toHaveLength(1);
  });

  it("saves comparison sets with scenario records", async () => {
    repositoryMocks.createCalculationComparisonSetRecord.mockResolvedValueOnce({ id: "compare_1" });
    repositoryMocks.createCalculationScenarioRecord
      .mockResolvedValueOnce({ id: "scenario_1" })
      .mockResolvedValueOnce({ id: "scenario_2" });
    repositoryMocks.createComparisonSetScenarioRecord.mockResolvedValue({});
    repositoryMocks.getCalculationComparisonSetRecord.mockResolvedValueOnce({
      id: "compare_1",
      organizationId: "org_local_craft_board",
      name: "Launch compare",
      notes: null,
      baseShelfSpecSnapshot: { lengthIn: 30, depthIn: 12 },
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      scenarios: [
        {
          id: "join_1",
          sortOrder: 0,
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          calculationScenario: {
            id: "scenario_1",
            organizationId: "org_local_craft_board",
            name: "Baseline",
            costProfileId: "profile_1",
            amazonFeePresetId: "preset_1",
            amazonFeePreset: { name: "Amazon Standard" },
            shippingZoneRuleId: null,
            shippingZoneRule: null,
            packagingRuleId: null,
            packagingRule: null,
            shippingRuleId: null,
            shippingRule: null,
            shelfCostCalculationId: null,
            launchStrategy: "BALANCED",
            rankingScore: { toNumber: () => 51.25 },
            rankingSummary: { recommendationNote: "Balanced" },
            isRecommendedLaunchScenario: true,
            assumptionsSnapshot: {},
            resultSnapshot: {},
            createdAt: new Date("2026-03-10T00:00:00.000Z"),
            updatedAt: new Date("2026-03-10T00:00:00.000Z")
          }
        }
      ]
    });

    const payload = await saveComparisonSet({
      organizationId: "org_local_craft_board",
      name: "Launch compare",
      baseSpec: {
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        quantity: 1,
        lengthIn: 30,
        depthIn: 12,
        thicknessIn: 0.75,
        materialCode: "WHITE_MELAMINE_075",
        edgeBandCode: "PVC_WHITE",
        edgeBandPattern: "LONG_EDGES",
        packagingCode: "STANDARD",
        shippingCode: "GROUND",
        laborMinutes: 12,
        machineMinutes: 8
      },
      scenarios: [{ name: "Baseline", amazonFeePresetId: "preset_1" }]
    });

    expect(payload.comparisonSet.id).toBe("compare_1");
    expect(repositoryMocks.createCalculationScenarioRecord).toHaveBeenCalled();
    expect(repositoryMocks.createCalculationComparisonSetRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        rankingSnapshot: expect.any(Object),
        comparisonSummary: expect.any(Object)
      })
    );
  });

  it("reranks a saved comparison set and updates the recommendation snapshot", async () => {
    repositoryMocks.getCalculationComparisonSetRecord
      .mockResolvedValueOnce({
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        baseShelfSpecSnapshot: {},
        rankingSnapshot: null,
        comparisonSummary: null,
        recommendedScenarioId: null,
        recommendedScenario: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        scenarios: [
          {
            id: "join_1",
            sortOrder: 0,
            createdAt: new Date("2026-03-10T00:00:00.000Z"),
            calculationScenario: {
              id: "scenario_1",
              name: "Balanced",
              launchStrategy: "BALANCED",
              resultSnapshot: {
                breakdown: {
                  breakEvenPriceCents: 4000,
                  recommendedMinSellPriceCents: 4600,
                  recommendedTargetSellPriceCents: 5200,
                  marketplaceFeeCostCents: 500,
                  referralFeeCostCents: 300,
                  advertisingAllowanceCostCents: 100,
                  returnReserveCostCents: 50,
                  damageReserveCostCents: 25,
                  miscMarketplaceCostCents: 25
                },
                pricing: { targetMarginPct: 20, growthMarginPct: 10 },
                shipping: { baseCostCents: 900, weightCostCents: 0, volumeCostCents: 0, dimensionalCostCents: 0, shippingBufferCostCents: 50 }
              }
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        baseShelfSpecSnapshot: {},
        rankingSnapshot: { recommendation: { recommendedScenarioId: "scenario_1" } },
        comparisonSummary: { recommendedScenarioId: "scenario_1" },
        recommendedScenarioId: "scenario_1",
        recommendedScenario: { id: "scenario_1", name: "Balanced" },
        selectedLaunchScenarioId: "scenario_1",
        selectedLaunchScenario: { id: "scenario_1", name: "Balanced" },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        scenarios: []
      })
      .mockResolvedValueOnce({
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        baseShelfSpecSnapshot: {},
        rankingSnapshot: { recommendation: { recommendedScenarioId: "scenario_1" } },
        comparisonSummary: { recommendedScenarioId: "scenario_1" },
        riskSummary: null,
        selectedLaunchSummary: null,
        recommendedScenarioId: "scenario_1",
        recommendedScenario: { id: "scenario_1", name: "Balanced" },
        selectedLaunchScenarioId: "scenario_1",
        selectedLaunchScenario: { id: "scenario_1", name: "Balanced" },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        scenarios: []
      });

    const payload = await rankComparisonSet({
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1"
    });

    expect(repositoryMocks.updateCalculationComparisonSetRecord).toHaveBeenCalled();
    expect(payload.comparisonSet.recommendedScenarioId).toBe("scenario_1");
  });

  it("builds listing readiness and export snapshots for the selected launch scenario", async () => {
    repositoryMocks.getCalculationComparisonSetRecord
      .mockResolvedValueOnce({
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        baseShelfSpecSnapshot: {},
        rankingSnapshot: { recommendation: { recommendedScenarioId: "scenario_1" } },
        comparisonSummary: { recommendedScenarioId: "scenario_1" },
        recommendedScenarioId: "scenario_1",
        selectedLaunchScenarioId: "scenario_1",
        selectedLaunchSummary: null,
        riskSummary: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        scenarios: [
          {
            id: "join_1",
            sortOrder: 0,
            createdAt: new Date("2026-03-10T00:00:00.000Z"),
            calculationScenario: {
              id: "scenario_1",
              organizationId: "org_local_craft_board",
              costProfileId: "profile_1",
              name: "Balanced",
              amazonFeePresetId: "preset_1",
              amazonFeePreset: { name: "Amazon Standard" },
              shippingZoneRuleId: "zone_1",
              shippingZoneRule: { name: "Zone 2" },
              packagingRuleId: "pack_1",
              packagingRule: { packagingName: "Standard" },
              shippingRuleId: "ship_1",
              shippingRule: { shippingName: "Ground" },
              shelfCostCalculationId: null,
              launchStrategy: "BALANCED",
              rankingScore: { toNumber: () => 51.25 },
              rankingSummary: { recommendationNote: "Balanced" },
              riskScore: { toNumber: () => 10 },
              riskLevel: "LOW",
              warningSnapshot: [],
              handoffSnapshot: null,
              assumptionsSnapshot: {
                name: "Pantry shelf",
                sku: "HUGO-SHELF-36W",
                lengthIn: 36,
                depthIn: 12,
                thicknessIn: 0.75,
                materialCode: "WHITE_MELAMINE_075",
                edgeBandPattern: "LONG_EDGES"
              },
              resultSnapshot: {
                breakdown: {
                  subtotalCostCents: 3600,
                  breakEvenPriceCents: 5200,
                  recommendedMinSellPriceCents: 5800,
                  recommendedTargetSellPriceCents: 6400,
                  marketplaceFeeCostCents: 600,
                  returnReserveCostCents: 80,
                  damageReserveCostCents: 40
                },
                shipping: {
                  baseCostCents: 1100,
                  shippingBufferCostCents: 100
                },
                amazonFees: {
                  closingFeeCostCents: 99,
                  fulfillmentFeeCostCents: 450,
                  storageAllowanceCostCents: 40,
                  advertisingAllowanceCostCents: 120,
                  miscMarketplaceCostCents: 20
                }
              },
              createdAt: new Date("2026-03-10T00:00:00.000Z"),
              updatedAt: new Date("2026-03-10T00:00:00.000Z")
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        baseShelfSpecSnapshot: {},
        rankingSnapshot: { recommendation: { recommendedScenarioId: "scenario_1" } },
        comparisonSummary: { recommendedScenarioId: "scenario_1" },
        recommendedScenarioId: "scenario_1",
        selectedLaunchScenarioId: "scenario_1",
        selectedLaunchSummary: { scenarioId: "scenario_1" },
        selectedLaunchExportSnapshot: { scenarioId: "scenario_1", listingReadinessStatus: "READY" },
        selectedLaunchReadinessStatus: "READY",
        selectedLaunchWarningSnapshot: [],
        riskSummary: null,
        recommendedScenario: { id: "scenario_1", name: "Balanced" },
        selectedLaunchScenario: { id: "scenario_1", name: "Balanced" },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        scenarios: []
      })
      .mockResolvedValueOnce({
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        selectedLaunchScenarioId: "scenario_1",
        selectedLaunchExportSnapshot: { scenarioId: "scenario_1", listingReadinessStatus: "READY" },
        selectedLaunchReadinessStatus: "READY",
        selectedLaunchWarningSnapshot: [],
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        scenarios: []
      });

    const evaluated = await evaluateComparisonSetListingReadiness({
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      selectedScenarioId: "scenario_1"
    });
    expect(repositoryMocks.updateCalculationScenarioRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        scenarioId: "scenario_1",
        data: expect.objectContaining({
          listingReadinessStatus: expect.any(String),
          exportSnapshot: expect.any(Object)
        })
      })
    );
    expect(evaluated.comparisonSet.selectedLaunchReadinessStatus).toBe("READY");

    const exportSummary = await getComparisonSetExportSummary({
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1"
    });
    expect(exportSummary.exportSummary).toEqual(
      expect.objectContaining({ scenarioId: "scenario_1", listingReadinessStatus: "READY" })
    );
  });

  it("rejects missing edge band rules when the pattern requires one", async () => {
    const profile = makeProfile();
    profile.edgeBandCostRules = [];
    repositoryMocks.getCostProfileRecord.mockResolvedValueOnce(profile);

    await expect(
      calculateShelfCostView({
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        quantity: 1,
        lengthIn: 24,
        depthIn: 12,
        materialCode: "WHITE_MELAMINE_075",
        edgeBandCode: "PVC_WHITE",
        edgeBandPattern: "ALL_FOUR",
        laborMinutes: 5,
        machineMinutes: 4
      })
    ).rejects.toThrow("Edge band rule is required for the selected edge band pattern.");
  });

  it("saves a calculation with assumptions and result snapshots", async () => {
    repositoryMocks.createShelfCostCalculationRecord.mockResolvedValueOnce({ id: "calc_1" });
    repositoryMocks.getShelfCostCalculationRecord.mockResolvedValueOnce({
      id: "calc_1",
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      costProfile: { name: "Hugo Base" },
      name: "Pantry shelf",
      sku: null,
      quantity: 1,
      lengthIn: { toNumber: () => 30 },
      depthIn: { toNumber: () => 12 },
      thicknessIn: { toNumber: () => 0.75 },
      materialCode: "WHITE_MELAMINE_075",
      edgeBandCode: "PVC_WHITE",
      edgeBandPattern: "LONG_EDGES",
      packagingCode: "STANDARD",
      shippingCode: "GROUND",
      laborMinutes: { toNumber: () => 12 },
      machineMinutes: { toNumber: () => 8 },
      overheadMinutes: { toNumber: () => 10 },
      packingMinutes: { toNumber: () => 9 },
      materialCostCents: 1200,
      edgeBandCostCents: 300,
      laborCostCents: 900,
      machineCostCents: 960,
      packagingCostCents: 956,
      packingLaborCostCents: 630,
      shippingCostCents: 1560,
      shippingBufferCostCents: 125,
      overheadCostCents: 300,
      marketplaceFeeCostCents: 1180,
      returnReserveCostCents: 157,
      damageReserveCostCents: 78,
      subtotalCostCents: 5276,
      breakEvenPriceCents: 6600,
      recommendedMinSellPriceCents: 7334,
      recommendedTargetSellPriceCents: 7914,
      targetMarginPct: { toNumber: () => 20 },
      growthMarginPct: { toNumber: () => 10 },
      recommendedInternalPriceCents: 6231,
      recommendedSellPriceCents: 6923,
      assumptionsSnapshot: {},
      packagingSnapshot: {},
      shippingSnapshot: {},
      pricingSnapshot: {},
      resultSnapshot: {},
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    const payload = await saveShelfCostCalculation({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Pantry shelf",
      quantity: 1,
      lengthIn: 30,
      depthIn: 12,
      thicknessIn: 0.75,
      materialCode: "WHITE_MELAMINE_075",
      edgeBandCode: "PVC_WHITE",
      edgeBandPattern: "LONG_EDGES",
      packagingCode: "STANDARD",
      shippingCode: "GROUND",
      laborMinutes: 12,
      machineMinutes: 8,
      overheadMinutes: 10,
      packingMinutes: 9,
      marketplaceFeePct: 15,
      returnReservePct: 2,
      damageReservePct: 1,
      shippingBufferPct: 8
    });

    expect(repositoryMocks.createShelfCostCalculationRecord).toHaveBeenCalled();
    expect(repositoryMocks.createShelfCostCalculationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        packingLaborCostCents: expect.any(Number),
        marketplaceFeeCostCents: expect.any(Number),
        returnReserveCostCents: expect.any(Number),
        damageReserveCostCents: expect.any(Number),
        breakEvenPriceCents: expect.any(Number),
        recommendedMinSellPriceCents: expect.any(Number),
        recommendedTargetSellPriceCents: expect.any(Number),
        packagingSnapshot: expect.any(Object),
        shippingSnapshot: expect.any(Object),
        pricingSnapshot: expect.any(Object)
      })
    );
    expect(payload.calculation.id).toBe("calc_1");
  });

  it("returns a saved calculation in org scope", async () => {
    repositoryMocks.getShelfCostCalculationRecord.mockResolvedValueOnce({
      id: "calc_1",
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      costProfile: { name: "Hugo Base" },
      name: "Pantry shelf",
      sku: null,
      quantity: 1,
      lengthIn: { toNumber: () => 30 },
      depthIn: { toNumber: () => 12 },
      thicknessIn: { toNumber: () => 0.75 },
      materialCode: "WHITE_MELAMINE_075",
      edgeBandCode: "PVC_WHITE",
      edgeBandPattern: "LONG_EDGES",
      packagingCode: "STANDARD",
      shippingCode: "GROUND",
      laborMinutes: { toNumber: () => 12 },
      machineMinutes: { toNumber: () => 8 },
      overheadMinutes: { toNumber: () => 10 },
      packingMinutes: { toNumber: () => 9 },
      materialCostCents: 1200,
      edgeBandCostCents: 300,
      laborCostCents: 900,
      machineCostCents: 960,
      packagingCostCents: 956,
      packingLaborCostCents: 630,
      shippingCostCents: 1560,
      shippingBufferCostCents: 125,
      overheadCostCents: 300,
      marketplaceFeeCostCents: 1180,
      returnReserveCostCents: 157,
      damageReserveCostCents: 78,
      subtotalCostCents: 5276,
      breakEvenPriceCents: 6600,
      recommendedMinSellPriceCents: 7334,
      recommendedTargetSellPriceCents: 7914,
      targetMarginPct: { toNumber: () => 20 },
      growthMarginPct: { toNumber: () => 10 },
      recommendedInternalPriceCents: 6231,
      recommendedSellPriceCents: 6923,
      assumptionsSnapshot: {},
      packagingSnapshot: {},
      shippingSnapshot: {},
      pricingSnapshot: {},
      resultSnapshot: {},
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    const payload = await getShelfCostCalculation({
      organizationId: "org_local_craft_board",
      calculationId: "calc_1"
    });

    expect(payload.calculation.id).toBe("calc_1");
  });
});

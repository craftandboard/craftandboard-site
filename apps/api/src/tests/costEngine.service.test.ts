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
  createChannelMappingPresetRecord: vi.fn(),
  createListingPrepPackageRecord: vi.fn(),
  createMarketplaceMappingTemplateRecord: vi.fn(),
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
  getChannelMappingPresetRecord: vi.fn(),
  getListingPrepPackageRecord: vi.fn(),
  getMarketplaceMappingTemplateRecord: vi.fn(),
  getShelfCostCalculationRecord: vi.fn(),
  getShippingZoneRuleRecord: vi.fn(),
  listAmazonFeePresetsForOrganization: vi.fn(),
  listCalculationComparisonSetsForOrganization: vi.fn(),
  listCostProfilesForOrganization: vi.fn(),
  listLaunchGuardrailProfilesForOrganization: vi.fn(),
  listLaunchTemplatesForOrganization: vi.fn(),
  listChannelMappingPresetsForOrganization: vi.fn(),
  listListingPrepPackagesForOrganization: vi.fn(),
  listMarketplaceMappingTemplatesForOrganization: vi.fn(),
  listShelfCostCalculationsForOrganization: vi.fn(),
  listShippingZoneRulesForOrganization: vi.fn(),
  updateAmazonFeePresetRecord: vi.fn(),
  updateCostProfileRecord: vi.fn(),
  updateEdgeBandCostRuleRecord: vi.fn(),
  updateCalculationComparisonSetRecord: vi.fn(),
  updateCalculationScenarioRecord: vi.fn(),
  updateLaunchGuardrailProfileRecord: vi.fn(),
  updateLaunchTemplateRecord: vi.fn(),
  updateListingPrepPackageRecord: vi.fn(),
  updateMarketplaceMappingTemplateRecord: vi.fn(),
  updateChannelMappingPresetRecord: vi.fn(),
  updateMaterialCostRuleRecord: vi.fn(),
  updatePackagingCostRuleRecord: vi.fn(),
  updateShippingCostRuleRecord: vi.fn(),
  clearCurrentApprovedArtifactsForScope: vi.fn(),
  updateShippingZoneRuleRecord: vi.fn()
}));

vi.mock("../modules/costEngine/repository.js", () => repositoryMocks);

import {
  calculateShelfCostView,
  compareShelfCostScenarios,
  createChannelMappingPreset,
  createMarketplaceMappingTemplate,
  createLaunchGuardrailProfile,
  createLaunchTemplate,
  buildListingPrepPackage,
  approveListingPrepPackage,
  applyChannelMappingPresetToPackage,
  evaluateMarketplaceFieldValidation,
  evaluateComparisonSetListingReadiness,
  getComparisonSetExportSummary,
  getChannelMappingPreset,
  getListingPrepPackage,
  getListingPrepManualAmazonExport,
  getMarketplaceMappingTemplate,
  getShelfCostCalculation,
  listChannelMappingPresets,
  listLaunchGuardrailProfiles,
  listListingPrepPackages,
  listMarketplaceMappingTemplates,
  rankComparisonSet,
  refreshListingPrepPackage,
  requestPriceFloorOverride,
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
    launchGuardrailProfiles: [],
    marketplaceMappingTemplates: [
      {
        id: "mapping_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        name: "Amazon balanced export",
        status: "ACTIVE",
        productLabelFormat: "{productLabel}",
        skuFormat: "HUGO-{sku}",
        includeWarningNotes: true,
        includeOverrideNotes: true,
        dimensionsFormat: "{dimensionSummary}",
        materialFormat: "{materialSummary}",
        packagingFormat: "{packagingSummary}",
        pricingFormat: "{pricingSummary}",
        notes: null,
        templateSnapshot: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ],
    channelMappingPresets: [
      {
        id: "channel_1",
        organizationId: "org_local_craft_board",
        costProfileId: "profile_1",
        name: "Amazon manual default",
        channelCode: "AMAZON_MANUAL",
        status: "ACTIVE",
        productLabelFormat: "{productLabel}",
        skuFormat: "AMZ-{sku}",
        includeWarningNotes: true,
        includeOverrideNotes: true,
        dimensionsFormat: "{dimensionSummary}",
        materialFormat: "{materialSummary}",
        packagingFormat: "{packagingSummary}",
        pricingFormat: "{pricingSummary}",
        fieldOrderingSnapshot: { groups: ["identity", "pricing", "warnings"] },
        notes: null,
        presetSnapshot: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]
  };
}

describe("cost engine service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repositoryMocks.getCostProfileRecord.mockResolvedValue(makeProfile());
    repositoryMocks.listCostProfilesForOrganization.mockResolvedValue([makeProfile()]);
    repositoryMocks.updateCalculationScenarioRecord.mockResolvedValue({ count: 1 });
    repositoryMocks.updateCalculationComparisonSetRecord.mockResolvedValue({ count: 1 });
    repositoryMocks.updateListingPrepPackageRecord.mockResolvedValue({ count: 1 });
    repositoryMocks.getLaunchGuardrailProfileRecord.mockResolvedValue(null);
    repositoryMocks.getMarketplaceMappingTemplateRecord.mockResolvedValue(makeProfile().marketplaceMappingTemplates[0]);
    repositoryMocks.getChannelMappingPresetRecord.mockResolvedValue(makeProfile().channelMappingPresets[0]);
    repositoryMocks.clearCurrentApprovedArtifactsForScope.mockResolvedValue({ count: 0 });
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

  it("creates, fetches, and lists marketplace mapping templates", async () => {
    repositoryMocks.createMarketplaceMappingTemplateRecord.mockResolvedValueOnce({ id: "mapping_1" });
    repositoryMocks.listMarketplaceMappingTemplatesForOrganization.mockResolvedValueOnce(
      makeProfile().marketplaceMappingTemplates
    );

    const created = await createMarketplaceMappingTemplate({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Amazon balanced export",
      productLabelFormat: "{productLabel}"
    });
    const fetched = await getMarketplaceMappingTemplate({
      organizationId: "org_local_craft_board",
      mappingTemplateId: "mapping_1"
    });
    const listed = await listMarketplaceMappingTemplates({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1"
    });

    expect(created.marketplaceMappingTemplate.id).toBe("mapping_1");
    expect(fetched.marketplaceMappingTemplate.name).toBe("Amazon balanced export");
    expect(listed.marketplaceMappingTemplates).toHaveLength(1);
  });

  it("creates, fetches, and lists channel mapping presets", async () => {
    repositoryMocks.createChannelMappingPresetRecord.mockResolvedValueOnce({ id: "channel_1" });
    repositoryMocks.listChannelMappingPresetsForOrganization.mockResolvedValueOnce(
      makeProfile().channelMappingPresets
    );

    const created = await createChannelMappingPreset({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Amazon manual default",
      channelCode: "AMAZON_MANUAL"
    });
    const fetched = await getChannelMappingPreset({
      organizationId: "org_local_craft_board",
      channelMappingPresetId: "channel_1"
    });
    const listed = await listChannelMappingPresets({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1"
    });

    expect(created.channelMappingPreset.id).toBe("channel_1");
    expect(fetched.channelMappingPreset.name).toBe("Amazon manual default");
    expect(listed.channelMappingPresets).toHaveLength(1);
  });

  it("refreshes a listing-prep package and preserves stable export metadata", async () => {
    const listingPrepPackageRecord = {
      id: "package_1",
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      calculationScenarioId: "scenario_1",
      marketplaceMappingTemplateId: "mapping_1",
      marketplaceMappingTemplate: makeProfile().marketplaceMappingTemplates[0],
      name: "Shelf launch package",
      status: "READY",
      listingReadinessStatus: "READY",
      exportVersion: "v1",
      exportShapeSnapshot: {
        packageId: "package_1",
        exportVersion: "v1"
      },
      marketplaceFieldSnapshot: {
        productLabel: "Shelf package"
      },
      validationSnapshot: {
        listingFieldValidationStatus: "VALID",
        missingFields: [],
        weakFields: [],
        readyFields: ["productLabel"],
        validationSummary: "Ready."
      },
      warningSnapshot: [],
      overrideSnapshot: null,
      overrideHistorySnapshot: [],
      readyForListingPrep: true,
      readyForListingPrepSummary: {
        readyForListingPrepStatus: "READY",
        blockingReasons: [],
        reviewReasons: []
      },
      notes: "Initial package",
      approvedAt: null,
      approvedByMembershipId: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      calculationScenario: {
        id: "scenario_1",
        organizationId: "org_local_craft_board",
        name: "Balanced launch",
        costProfileId: "profile_1",
        amazonFeePresetId: "preset_1",
        amazonFeePreset: { name: "Amazon Standard" },
        shippingZoneRuleId: "zone_1",
        shippingZoneRule: { name: "Zone 2" },
        packagingRuleId: "pack_1",
        packagingRule: { packagingName: "Standard" },
        shippingRuleId: "ship_1",
        shippingRule: { shippingName: "Ground" },
        shelfCostCalculationId: "calc_1",
        shelfCostCalculation: {
          id: "calc_1",
          name: "Shelf calc",
          sku: "SHELF-30",
          quantity: 1,
          lengthIn: { toNumber: () => 30 },
          depthIn: { toNumber: () => 12 },
          thicknessIn: { toNumber: () => 0.75 },
          materialCode: "WHITE_MELAMINE_075",
          edgeBandPattern: "LONG_EDGES",
          packagingCode: "STANDARD",
          packagingRule: { packagingName: "Standard" },
          shippingCode: "GROUND",
          shippingRule: { shippingName: "Ground" },
          materialCostCents: 1000,
          edgeBandCostCents: 100,
          laborCostCents: 200,
          machineCostCents: 150,
          packagingCostCents: 50,
          shippingCostCents: 75,
          overheadCostCents: 25,
          subtotalCostCents: 1600,
          breakEvenPriceCents: 2100,
          recommendedMinSellPriceCents: 2400,
          recommendedTargetSellPriceCents: 2800,
          recommendedSellPriceCents: 2600,
          targetMarginPct: { toNumber: () => 20 },
          growthMarginPct: { toNumber: () => 10 },
          assumptionsSnapshot: {},
          resultSnapshot: {},
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z")
        },
        assumptionsSnapshot: {},
        resultSnapshot: {
          breakdown: {
            subtotalCostCents: 1600,
            breakEvenPriceCents: 2100,
            recommendedMinSellPriceCents: 2400,
            recommendedTargetSellPriceCents: 2800,
            marketplaceFeeCostCents: 180,
            returnReserveCostCents: 40,
            damageReserveCostCents: 20
          },
          shipping: {
            baseCostCents: 75,
            weightCostCents: 0,
            volumeCostCents: 0,
            dimensionalCostCents: 0,
            shippingBufferCostCents: 15
          },
          amazonFees: {
            closingFeeCostCents: 99,
            fulfillmentFeeCostCents: 450,
            storageAllowanceCostCents: 40,
            advertisingAllowanceCostCents: 60,
            miscMarketplaceCostCents: 10
          }
        },
        launchStrategy: "BALANCED",
        rankingScore: { toNumber: () => 88 },
        rankingSummary: {},
        isRecommendedLaunchScenario: true,
        guardrailProfileId: null,
        riskScore: { toNumber: () => 18 },
        riskLevel: "LOW",
        guardrailSnapshot: {},
        warningSnapshot: [],
        handoffSnapshot: {},
        isLaunchApprovedCandidate: true,
        listingReadinessStatus: "READY",
        listingReadinessSnapshot: {
          listingReadinessStatus: "READY"
        },
        marketplaceFieldSnapshot: {
          productLabel: "Shelf package"
        },
        strongerAlertSnapshot: [],
        exportSnapshot: {},
        latestOverrideSummarySnapshot: null,
        listingPrepPackageId: "package_1",
        priceFloorOverrideRequested: false,
        priceFloorOverrideApproved: false,
        priceFloorOverrideSnapshot: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      },
      comparisonSet: {
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        notes: null,
        baseShelfSpecSnapshot: {},
        recommendedScenarioId: "scenario_1",
        rankingSnapshot: {},
        comparisonSummary: {},
        selectedLaunchScenarioId: "scenario_1",
        selectedLaunchSummary: {},
        riskSummary: {},
        selectedListingPrepPackageId: "package_1",
        listingPrepSummarySnapshot: {},
        selectedListingPrepReadySnapshot: {
          readyForListingPrepStatus: "READY"
        },
        selectedListingPrepExportVersion: "v1",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    };

    repositoryMocks.getListingPrepPackageRecord
      .mockResolvedValueOnce(listingPrepPackageRecord)
      .mockResolvedValueOnce(listingPrepPackageRecord);

    const refreshed = await refreshListingPrepPackage({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1"
    });

    const updateCall = repositoryMocks.updateListingPrepPackageRecord.mock.calls[0]?.[0];
    expect(updateCall.organizationId).toBe("org_local_craft_board");
    expect(updateCall.listingPrepPackageId).toBe("package_1");
    expect(updateCall.data.exportVersion).toBe("v1");
    expect(updateCall.data.exportShapeSnapshot.packageId).toBe("package_1");
    expect(updateCall.data.exportShapeSnapshot.exportMetadata.exportVersion).toBe("v1");
    expect(refreshed.listingPrepPackage.exportVersion).toBe("v1");
    expect(typeof refreshed.listingPrepPackage.readyForListingPrep).toBe("boolean");
    expect(refreshed.listingPrepPackage.readyForListingPrepSummary).toBeTruthy();
  });

  it("applies a channel preset to a listing-prep package", async () => {
    const listingPrepPackageRecord = {
      id: "package_1",
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      calculationScenarioId: "scenario_1",
      marketplaceMappingTemplateId: "mapping_1",
      marketplaceMappingTemplate: makeProfile().marketplaceMappingTemplates[0],
      channelMappingPresetId: null,
      channelMappingPreset: null,
      name: "Shelf launch package",
      status: "READY",
      approvalState: "READY",
      listingReadinessStatus: "READY",
      exportVersion: "v1",
      exportContractVersion: "manual-amazon-v1",
      exportShapeSnapshot: { packageId: "package_1", exportMetadata: { exportVersion: "v1" } },
      marketplaceFieldSnapshot: { productLabel: "Shelf package" },
      validationSnapshot: { listingFieldValidationStatus: "VALID", missingFields: [], weakFields: [], readyFields: ["productLabel"], validationSummary: "Ready." },
      warningSnapshot: [],
      overrideSnapshot: null,
      approvalSummarySnapshot: null,
      overrideHistorySnapshot: [],
      readyForListingPrep: true,
      readyForListingPrepSummary: { readyForListingPrepStatus: "READY", blockingReasons: [], reviewReasons: [] },
      manualAmazonExportSnapshot: { exportContractVersion: "manual-amazon-v1" },
      currentApprovedArtifact: false,
      notes: "Initial package",
      approvedAt: null,
      approvedByMembershipId: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      calculationScenario: {
        id: "scenario_1",
        organizationId: "org_local_craft_board",
        name: "Balanced launch",
        costProfileId: "profile_1",
        assumptionsSnapshot: {},
        resultSnapshot: {
          breakdown: {
            breakEvenPriceCents: 2200,
            recommendedMinSellPriceCents: 2500,
            recommendedTargetSellPriceCents: 2900,
            marketplaceFeeCostCents: 200,
            returnReserveCostCents: 40,
            damageReserveCostCents: 20
          },
          shipping: {
            baseCostCents: 200,
            weightCostCents: 0,
            volumeCostCents: 0,
            dimensionalCostCents: 0,
            shippingBufferCostCents: 20
          },
          amazonFees: {
            closingFeeCostCents: 99,
            fulfillmentFeeCostCents: 450,
            storageAllowanceCostCents: 40,
            advertisingAllowanceCostCents: 60,
            miscMarketplaceCostCents: 10
          }
        },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      },
      comparisonSet: {
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    };

    repositoryMocks.getListingPrepPackageRecord
      .mockResolvedValueOnce(listingPrepPackageRecord)
      .mockResolvedValue({
        ...listingPrepPackageRecord,
        channelMappingPresetId: "channel_1",
        channelMappingPreset: makeProfile().channelMappingPresets[0]
      });

    const payload = await applyChannelMappingPresetToPackage({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      channelMappingPresetId: "channel_1"
    });

    expect(repositoryMocks.updateListingPrepPackageRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        listingPrepPackageId: "package_1",
        data: expect.objectContaining({
          channelMappingPresetId: "channel_1"
        })
      })
    );
    expect(payload.listingPrepPackage.channelMappingPresetId).toBe("channel_1");
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

  it("approves a listing-prep package and marks it as the current approved artifact", async () => {
    const listingPrepPackageRecord = {
      id: "package_1",
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      calculationScenarioId: "scenario_1",
      marketplaceMappingTemplateId: "mapping_1",
      marketplaceMappingTemplate: makeProfile().marketplaceMappingTemplates[0],
      channelMappingPresetId: "channel_1",
      channelMappingPreset: makeProfile().channelMappingPresets[0],
      name: "Shelf launch package",
      status: "READY",
      approvalState: "READY",
      listingReadinessStatus: "READY",
      exportVersion: "v1",
      exportContractVersion: "manual-amazon-v1",
      exportShapeSnapshot: {
        packageId: "package_1",
        productLabel: "Shelf package",
        exportMetadata: { exportVersion: "v1" }
      },
      marketplaceFieldSnapshot: {
        productLabel: "Shelf package",
        sku: "AMZ-SHELF-30",
        dimensionSummary: '30" x 12"',
        materialSummary: "White melamine",
        edgeBandSummary: "Long edges only",
        packagingSummary: "Standard",
        shippingSummary: "Ground",
        feePresetLabel: "Amazon Standard",
        shippingZoneLabel: "Zone 2",
        launchStrategyLabel: "Balanced launch"
      },
      validationSnapshot: {
        listingFieldValidationStatus: "VALID",
        missingFields: [],
        weakFields: [],
        readyFields: ["productLabel", "dimensionSummary"],
        validationSummary: "Ready."
      },
      warningSnapshot: [],
      overrideSnapshot: {
        overrideRequested: false,
        overrideApproved: false,
        summary: "No override needed."
      },
      approvalSummarySnapshot: null,
      overrideHistorySnapshot: [],
      readyForListingPrep: true,
      readyForListingPrepSummary: {
        readyForListingPrepStatus: "READY",
        summary: "Package is ready.",
        blockingReasons: [],
        reviewReasons: []
      },
      manualAmazonExportSnapshot: { exportContractVersion: "manual-amazon-v1" },
      currentApprovedArtifact: false,
      notes: null,
      approvedAt: null,
      approvedByMembershipId: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      calculationScenario: {
        id: "scenario_1",
        organizationId: "org_local_craft_board",
        name: "Balanced launch",
        costProfileId: "profile_1",
        assumptionsSnapshot: {},
        resultSnapshot: {
          breakdown: {
            breakEvenPriceCents: 2200,
            recommendedMinSellPriceCents: 2500,
            recommendedTargetSellPriceCents: 2900,
            marketplaceFeeCostCents: 200,
            returnReserveCostCents: 40,
            damageReserveCostCents: 20
          },
          shipping: {
            baseCostCents: 200,
            weightCostCents: 0,
            volumeCostCents: 0,
            dimensionalCostCents: 0,
            shippingBufferCostCents: 20
          },
          amazonFees: {
            closingFeeCostCents: 99,
            fulfillmentFeeCostCents: 450,
            storageAllowanceCostCents: 40,
            advertisingAllowanceCostCents: 60,
            miscMarketplaceCostCents: 10
          }
        },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      },
      comparisonSet: {
        id: "compare_1",
        organizationId: "org_local_craft_board",
        name: "Launch compare",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    };

    repositoryMocks.getListingPrepPackageRecord
      .mockResolvedValueOnce(listingPrepPackageRecord)
      .mockResolvedValueOnce({
        ...listingPrepPackageRecord,
        approvalState: "APPROVED",
        currentApprovedArtifact: true,
        manualAmazonExportSnapshot: { exportContractVersion: "manual-amazon-v1" }
      });

    const payload = await approveListingPrepPackage({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      approvedByMembershipId: "membership_local_brandon"
    });

    expect(repositoryMocks.clearCurrentApprovedArtifactsForScope).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      calculationScenarioId: "scenario_1",
      exceptListingPrepPackageId: "package_1"
    });
    expect(repositoryMocks.updateListingPrepPackageRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        listingPrepPackageId: "package_1",
        data: expect.objectContaining({
          approvalState: "APPROVED",
          currentApprovedArtifact: true
        })
      })
    );
    expect(payload.listingPrepPackage.currentApprovedArtifact).toBe(true);
  });

  it("returns the manual Amazon export contract for a listing-prep package", async () => {
    repositoryMocks.getListingPrepPackageRecord.mockResolvedValueOnce({
      id: "package_1",
      organizationId: "org_local_craft_board",
      manualAmazonExportSnapshot: { exportContractVersion: "manual-amazon-v1", productLabel: "Shelf package" },
      approvalState: "APPROVED",
      currentApprovedArtifact: true
    });

    const payload = await getListingPrepManualAmazonExport({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1"
    });

    expect(payload.approvalState).toBe("APPROVED");
    expect(payload.currentApprovedArtifact).toBe(true);
    expect((payload.manualAmazonExport as Record<string, unknown>).exportContractVersion).toBe("manual-amazon-v1");
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

  it("builds a listing-prep package for the selected launch scenario", async () => {
    repositoryMocks.getCalculationComparisonSetRecord.mockResolvedValueOnce({
      id: "compare_1",
      organizationId: "org_local_craft_board",
      name: "Launch compare",
      notes: null,
      selectedLaunchScenarioId: "scenario_1",
      recommendedScenarioId: "scenario_1",
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
            resultSnapshot: {
              breakdown: {
                subtotalCostCents: 5200,
                breakEvenPriceCents: 6000,
                recommendedMinSellPriceCents: 6400,
                recommendedTargetSellPriceCents: 7600,
                marketplaceFeeCostCents: 900,
                returnReserveCostCents: 120,
                damageReserveCostCents: 60
              },
              shipping: {
                baseCostCents: 1100,
                weightCostCents: 0,
                volumeCostCents: 0,
                dimensionalCostCents: 0,
                shippingBufferCostCents: 90
              },
              amazonFees: {
                closingFeeCostCents: 99,
                fulfillmentFeeCostCents: 450,
                storageAllowanceCostCents: 25,
                advertisingAllowanceCostCents: 100,
                miscMarketplaceCostCents: 20
              }
            },
            warningSnapshot: [{ code: "FLOOR_TIGHT", severity: "BLOCKING", message: "Too close to floor" }],
            handoffSnapshot: null,
            launchStrategy: "BALANCED",
            amazonFeePreset: { name: "Amazon Standard" },
            shippingZoneRule: { name: "Zone 2" },
            packagingRule: { packagingName: "Standard" },
            shippingRule: { shippingName: "Ground" },
            assumptionsSnapshot: {},
            riskScore: { toNumber: () => 65 },
            riskLevel: "HIGH",
            listingReadinessStatus: "NEEDS_REVIEW",
            createdAt: new Date("2026-03-10T00:00:00.000Z"),
            updatedAt: new Date("2026-03-10T00:00:00.000Z")
          }
        }
      ]
    });
    repositoryMocks.createListingPrepPackageRecord.mockResolvedValueOnce({ id: "package_1" });
    repositoryMocks.getListingPrepPackageRecord.mockResolvedValueOnce({
      id: "package_1",
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      calculationScenarioId: "scenario_1",
      name: "Balanced listing prep",
      status: "BLOCKED",
      approvalState: "BLOCKED",
      listingReadinessStatus: "NEEDS_REVIEW",
      exportSnapshot: {},
      exportShapeSnapshot: {},
      exportVersion: "listing-prep-v1",
      exportContractVersion: "manual-amazon-v1",
      marketplaceFieldSnapshot: {},
      validationSnapshot: { validationStatus: "INVALID" },
      warningSnapshot: [{ code: "FLOOR_TIGHT", severity: "BLOCKING", message: "Too close to floor" }],
      overrideSnapshot: { overrideRequested: false, overrideApproved: false, summary: "Override required" },
      approvalSummarySnapshot: null,
      overrideHistorySnapshot: [],
      readyForListingPrep: false,
      readyForListingPrepSummary: { readyForListingPrepStatus: "BLOCKED", blockingReasons: ["Price floor"], reviewReasons: [] },
      manualAmazonExportSnapshot: null,
      currentApprovedArtifact: false,
      marketplaceMappingTemplateId: null,
      marketplaceMappingTemplate: null,
      channelMappingPresetId: null,
      channelMappingPreset: null,
      notes: null,
      approvedAt: null,
      approvedByMembershipId: null,
      calculationScenario: { name: "Balanced" },
      comparisonSet: { name: "Launch compare" },
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    const payload = await buildListingPrepPackage({
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1"
    });

    expect(repositoryMocks.createListingPrepPackageRecord).toHaveBeenCalled();
    expect(repositoryMocks.updateCalculationScenarioRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        scenarioId: "scenario_1",
        data: expect.objectContaining({
          listingPrepPackageId: "package_1"
        })
      })
    );
    expect(payload.listingPrepPackage.id).toBe("package_1");
  });

  it("revalidates marketplace fields for a listing-prep package", async () => {
    repositoryMocks.getListingPrepPackageRecord
      .mockResolvedValueOnce({
        id: "package_1",
        organizationId: "org_local_craft_board",
        comparisonSetId: "compare_1",
        calculationScenarioId: "scenario_1",
        name: "Balanced listing prep",
        status: "READY_FOR_REVIEW",
        listingReadinessStatus: "NEEDS_REVIEW",
        marketplaceFieldSnapshot: { productLabel: "Shelf", dimensionSummary: "30 x 12", materialSummary: "White melamine" },
        validationSnapshot: {},
        warningSnapshot: [],
        overrideSnapshot: { overrideRequested: false, overrideApproved: false },
        notes: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "package_1",
        organizationId: "org_local_craft_board",
        comparisonSetId: "compare_1",
        calculationScenarioId: "scenario_1",
        name: "Balanced listing prep",
        status: "READY_FOR_REVIEW",
        listingReadinessStatus: "NEEDS_REVIEW",
        exportSnapshot: {},
        marketplaceFieldSnapshot: {},
        validationSnapshot: { validationStatus: "REVIEW_NEEDED", weakFields: ["sku"] },
        warningSnapshot: [],
        overrideSnapshot: { overrideRequested: false, overrideApproved: false },
        notes: "Revalidated",
        approvedAt: null,
        approvedByMembershipId: null,
        calculationScenario: { name: "Balanced" },
        comparisonSet: { name: "Launch compare" },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      });

    const payload = await evaluateMarketplaceFieldValidation({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      notes: "Revalidated"
    });

    expect(repositoryMocks.updateListingPrepPackageRecord).toHaveBeenCalled();
    expect(payload.listingPrepPackage.id).toBe("package_1");
  });

  it("records a price-floor override request and approval on a listing-prep package", async () => {
    repositoryMocks.getListingPrepPackageRecord
      .mockResolvedValueOnce({
        id: "package_1",
        organizationId: "org_local_craft_board",
        comparisonSetId: "compare_1",
        calculationScenarioId: "scenario_1",
        name: "Balanced listing prep",
        status: "BLOCKED",
        listingReadinessStatus: "NEEDS_REVIEW",
        marketplaceFieldSnapshot: { productLabel: "Shelf" },
        validationSnapshot: {},
        warningSnapshot: [{ code: "FLOOR_TIGHT", severity: "BLOCKING", message: "Too close to floor" }],
        overrideSnapshot: { overrideRequested: false, overrideApproved: false },
        notes: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "package_1",
        organizationId: "org_local_craft_board",
        comparisonSetId: "compare_1",
        calculationScenarioId: "scenario_1",
        name: "Balanced listing prep",
        status: "BLOCKED",
        listingReadinessStatus: "NEEDS_REVIEW",
        exportSnapshot: {},
        marketplaceFieldSnapshot: {},
        validationSnapshot: { validationStatus: "INVALID" },
        warningSnapshot: [{ code: "FLOOR_TIGHT", severity: "BLOCKING", message: "Too close to floor" }],
        overrideSnapshot: { overrideRequested: true, overrideApproved: true, overrideReason: "Intentional" },
        notes: null,
        approvedAt: new Date("2026-03-10T00:00:00.000Z"),
        approvedByMembershipId: "membership_1",
        calculationScenario: { name: "Balanced" },
        comparisonSet: { name: "Launch compare" },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      });

    const payload = await requestPriceFloorOverride({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      reason: "Intentional margin tradeoff",
      approve: true,
      approvedByMembershipId: "membership_1"
    });

    expect(repositoryMocks.updateListingPrepPackageRecord).toHaveBeenCalled();
    expect(repositoryMocks.updateCalculationScenarioRecord).toHaveBeenCalled();
    expect(payload.listingPrepPackage.id).toBe("package_1");
  });

  it("lists listing-prep packages in org scope", async () => {
    repositoryMocks.listListingPrepPackagesForOrganization.mockResolvedValueOnce([
      {
        id: "package_1",
        organizationId: "org_local_craft_board",
        comparisonSetId: "compare_1",
        calculationScenarioId: "scenario_1",
        name: "Balanced listing prep",
        status: "READY",
        listingReadinessStatus: "READY",
        exportSnapshot: {},
        marketplaceFieldSnapshot: {},
        validationSnapshot: { validationStatus: "VALID" },
        warningSnapshot: [],
        overrideSnapshot: { overrideRequested: false, overrideApproved: false },
        notes: null,
        approvedAt: null,
        approvedByMembershipId: null,
        calculationScenario: { name: "Balanced" },
        comparisonSet: { name: "Launch compare" },
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]);

    const payload = await listListingPrepPackages({ organizationId: "org_local_craft_board" });
    expect(payload.listingPrepPackages).toHaveLength(1);
  });

  it("returns a saved listing-prep package in org scope", async () => {
    repositoryMocks.getListingPrepPackageRecord.mockResolvedValueOnce({
      id: "package_1",
      organizationId: "org_local_craft_board",
      comparisonSetId: "compare_1",
      calculationScenarioId: "scenario_1",
      name: "Balanced listing prep",
      status: "READY",
      listingReadinessStatus: "READY",
      exportSnapshot: {},
      marketplaceFieldSnapshot: {},
      validationSnapshot: { validationStatus: "VALID" },
      warningSnapshot: [],
      overrideSnapshot: { overrideRequested: false, overrideApproved: false },
      notes: null,
      approvedAt: null,
      approvedByMembershipId: null,
      calculationScenario: { name: "Balanced" },
      comparisonSet: { name: "Launch compare" },
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    const payload = await getListingPrepPackage({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1"
    });
    expect(payload.listingPrepPackage.id).toBe("package_1");
  });
});

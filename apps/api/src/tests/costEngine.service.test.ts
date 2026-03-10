import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createCostProfileRecord: vi.fn(),
  createEdgeBandCostRuleRecord: vi.fn(),
  createMaterialCostRuleRecord: vi.fn(),
  createPackagingCostRuleRecord: vi.fn(),
  createShelfCostCalculationRecord: vi.fn(),
  createShippingCostRuleRecord: vi.fn(),
  getCostProfileRecord: vi.fn(),
  getShelfCostCalculationRecord: vi.fn(),
  listCostProfilesForOrganization: vi.fn(),
  listShelfCostCalculationsForOrganization: vi.fn(),
  updateCostProfileRecord: vi.fn(),
  updateEdgeBandCostRuleRecord: vi.fn(),
  updateMaterialCostRuleRecord: vi.fn(),
  updatePackagingCostRuleRecord: vi.fn(),
  updateShippingCostRuleRecord: vi.fn()
}));

vi.mock("../modules/costEngine/repository.js", () => repositoryMocks);

import {
  calculateShelfCostView,
  getShelfCostCalculation,
  listCostProfiles,
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
        otherPackagingCostCents: 0,
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
        flatOverride: null,
        active: true,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]
  };
}

describe("cost engine service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getCostProfileRecord.mockResolvedValue(makeProfile());
    repositoryMocks.listCostProfilesForOrganization.mockResolvedValue([makeProfile()]);
  });

  it("lists cost profiles in org scope", async () => {
    const payload = await listCostProfiles({ organizationId: "org_local_craft_board" });
    expect(payload.profiles).toHaveLength(1);
    expect(payload.profiles[0]?.name).toBe("Hugo Base");
  });

  it("calculates a shelf cost breakdown with material, edge band, packaging, shipping, and margin", async () => {
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
      laborMinutes: 12,
      machineMinutes: 8,
      overheadMinutes: 10
    });

    expect(payload.calculation.materialCostCents).toBeGreaterThan(0);
    expect(payload.calculation.edgeBandCostCents).toBeGreaterThan(0);
    expect(payload.calculation.packagingCostCents).toBe(230);
    expect(payload.calculation.shippingCostCents).toBeGreaterThanOrEqual(1295);
    expect(payload.calculation.recommendedSellPriceCents).toBeGreaterThan(
      payload.calculation.subtotalCostCents
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
      materialCostCents: 1200,
      edgeBandCostCents: 300,
      laborCostCents: 900,
      machineCostCents: 960,
      packagingCostCents: 230,
      shippingCostCents: 1295,
      overheadCostCents: 300,
      subtotalCostCents: 4985,
      targetMarginPct: { toNumber: () => 20 },
      growthMarginPct: { toNumber: () => 10 },
      recommendedInternalPriceCents: 6231,
      recommendedSellPriceCents: 6923,
      assumptionsSnapshot: {},
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
      overheadMinutes: 10
    });

    expect(repositoryMocks.createShelfCostCalculationRecord).toHaveBeenCalled();
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
      materialCostCents: 1200,
      edgeBandCostCents: 300,
      laborCostCents: 900,
      machineCostCents: 960,
      packagingCostCents: 230,
      shippingCostCents: 1295,
      overheadCostCents: 300,
      subtotalCostCents: 4985,
      targetMarginPct: { toNumber: () => 20 },
      growthMarginPct: { toNumber: () => 10 },
      recommendedInternalPriceCents: 6231,
      recommendedSellPriceCents: 6923,
      assumptionsSnapshot: {},
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

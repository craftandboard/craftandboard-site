import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getCostProfileReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" }
  })),
  getCostProfileWriteContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" }
  })),
  getCostCalculationReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" }
  })),
  getCostCalculationWriteContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    currentMembership: { id: "membership_local_brandon" }
  }))
}));

const requestContextMocks = vi.hoisted(() => ({
  RequestAuthenticationError: class RequestAuthenticationError extends Error {}
}));

const authorizationMocks = vi.hoisted(() => ({
  AuthorizationError: class AuthorizationError extends Error {}
}));

const serviceMocks = vi.hoisted(() => ({
  createCostProfile: vi.fn(),
  listCostProfiles: vi.fn(),
  getCostProfile: vi.fn(),
  updateCostProfile: vi.fn(),
  createMaterialCostRule: vi.fn(),
  updateMaterialCostRule: vi.fn(),
  createEdgeBandCostRule: vi.fn(),
  updateEdgeBandCostRule: vi.fn(),
  createPackagingCostRule: vi.fn(),
  updatePackagingCostRule: vi.fn(),
  createShippingCostRule: vi.fn(),
  updateShippingCostRule: vi.fn(),
  createAmazonFeePreset: vi.fn(),
  createLaunchGuardrailProfile: vi.fn(),
  createLaunchTemplate: vi.fn(),
  buildListingPrepPackage: vi.fn(),
  createChannelMappingPreset: vi.fn(),
  createMarketplaceMappingTemplate: vi.fn(),
  listAmazonFeePresets: vi.fn(),
  listChannelMappingPresets: vi.fn(),
  listMarketplaceMappingTemplates: vi.fn(),
  getAmazonFeePreset: vi.fn(),
  getChannelMappingPreset: vi.fn(),
  getLaunchGuardrailProfile: vi.fn(),
  getListingPrepPackage: vi.fn(),
  getListingPrepManualAmazonExport: vi.fn(),
  getMarketplaceMappingTemplate: vi.fn(),
  getComparisonSetRecommendation: vi.fn(),
  getComparisonSetHandoffSummary: vi.fn(),
  getComparisonSetExportSummary: vi.fn(),
  updateAmazonFeePreset: vi.fn(),
  updateChannelMappingPreset: vi.fn(),
  updateMarketplaceMappingTemplate: vi.fn(),
  createShippingZoneRule: vi.fn(),
  listShippingZoneRules: vi.fn(),
  getShippingZoneRule: vi.fn(),
  getLaunchTemplate: vi.fn(),
  updateShippingZoneRule: vi.fn(),
  updateLaunchGuardrailProfile: vi.fn(),
  listLaunchGuardrailProfiles: vi.fn(),
  listLaunchTemplates: vi.fn(),
  listListingPrepPackages: vi.fn(),
  calculateShelfCostView: vi.fn(),
  compareShelfCostScenarios: vi.fn(),
  evaluateComparisonSetGuardrails: vi.fn(),
  evaluateComparisonSetListingReadiness: vi.fn(),
  rankComparisonSet: vi.fn(),
  selectLaunchScenario: vi.fn(),
  evaluateMarketplaceFieldValidation: vi.fn(),
  applyChannelMappingPresetToPackage: vi.fn(),
  approveListingPrepPackage: vi.fn(),
  requestPriceFloorOverride: vi.fn(),
  refreshListingPrepPackage: vi.fn(),
  saveShelfCostCalculation: vi.fn(),
  listShelfCostCalculations: vi.fn(),
  getShelfCostCalculation: vi.fn(),
  saveComparisonSet: vi.fn(),
  listComparisonSets: vi.fn(),
  getComparisonSet: vi.fn(),
  updateLaunchTemplate: vi.fn()
}));

vi.mock("../modules/costEngine/contextAdapter.js", () => contextMocks);
vi.mock("../modules/costEngine/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import costEngineRouter from "../routes/costEngine.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", costEngineRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  serviceMocks.listCostProfiles.mockResolvedValue({ ok: true, profiles: [] });
  serviceMocks.createCostProfile.mockResolvedValue({ ok: true, profile: { id: "profile_1" } });
  serviceMocks.getCostProfile.mockResolvedValue({ ok: true, profile: { id: "profile_1" } });
  serviceMocks.updateCostProfile.mockResolvedValue({ ok: true, profile: { id: "profile_1" } });
  serviceMocks.createMaterialCostRule.mockResolvedValue({ ok: true });
  serviceMocks.updateMaterialCostRule.mockResolvedValue({ ok: true });
  serviceMocks.createEdgeBandCostRule.mockResolvedValue({ ok: true });
  serviceMocks.updateEdgeBandCostRule.mockResolvedValue({ ok: true });
  serviceMocks.createPackagingCostRule.mockResolvedValue({ ok: true });
  serviceMocks.updatePackagingCostRule.mockResolvedValue({ ok: true });
  serviceMocks.createShippingCostRule.mockResolvedValue({ ok: true });
  serviceMocks.updateShippingCostRule.mockResolvedValue({ ok: true });
  serviceMocks.createAmazonFeePreset.mockResolvedValue({ ok: true, preset: { id: "preset_1" } });
  serviceMocks.createLaunchGuardrailProfile.mockResolvedValue({ ok: true, launchGuardrailProfile: { id: "guard_1" } });
  serviceMocks.createLaunchTemplate.mockResolvedValue({ ok: true, launchTemplate: { id: "template_1" } });
  serviceMocks.buildListingPrepPackage.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.createChannelMappingPreset.mockResolvedValue({ ok: true, channelMappingPreset: { id: "channel_1" } });
  serviceMocks.createMarketplaceMappingTemplate.mockResolvedValue({ ok: true, marketplaceMappingTemplate: { id: "mapping_1" } });
  serviceMocks.listAmazonFeePresets.mockResolvedValue({ ok: true, presets: [] });
  serviceMocks.listChannelMappingPresets.mockResolvedValue({ ok: true, channelMappingPresets: [] });
  serviceMocks.listMarketplaceMappingTemplates.mockResolvedValue({ ok: true, marketplaceMappingTemplates: [] });
  serviceMocks.getAmazonFeePreset.mockResolvedValue({ ok: true, preset: { id: "preset_1" } });
  serviceMocks.getChannelMappingPreset.mockResolvedValue({ ok: true, channelMappingPreset: { id: "channel_1" } });
  serviceMocks.getLaunchGuardrailProfile.mockResolvedValue({ ok: true, launchGuardrailProfile: { id: "guard_1" } });
  serviceMocks.getListingPrepPackage.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.getListingPrepManualAmazonExport.mockResolvedValue({ ok: true, manualAmazonExport: { exportContractVersion: "manual-amazon-v1" }, approvalState: "APPROVED", currentApprovedArtifact: true });
  serviceMocks.getMarketplaceMappingTemplate.mockResolvedValue({ ok: true, marketplaceMappingTemplate: { id: "mapping_1" } });
  serviceMocks.getComparisonSetRecommendation.mockResolvedValue({ ok: true, recommendation: null });
  serviceMocks.getComparisonSetHandoffSummary.mockResolvedValue({ ok: true, handoffSummary: null, selectedLaunchScenarioId: null, riskSummary: null, selectedLaunchReadinessStatus: null, selectedLaunchWarningSnapshot: null, exportSummary: null });
  serviceMocks.getComparisonSetExportSummary.mockResolvedValue({ ok: true, exportSummary: null, selectedLaunchScenarioId: null, selectedLaunchReadinessStatus: null, selectedLaunchWarningSnapshot: null });
  serviceMocks.updateAmazonFeePreset.mockResolvedValue({ ok: true, preset: { id: "preset_1" } });
  serviceMocks.updateChannelMappingPreset.mockResolvedValue({ ok: true, channelMappingPreset: { id: "channel_1" } });
  serviceMocks.updateMarketplaceMappingTemplate.mockResolvedValue({ ok: true, marketplaceMappingTemplate: { id: "mapping_1" } });
  serviceMocks.createShippingZoneRule.mockResolvedValue({ ok: true, shippingZoneRule: { id: "zone_1" } });
  serviceMocks.listShippingZoneRules.mockResolvedValue({ ok: true, shippingZoneRules: [] });
  serviceMocks.getShippingZoneRule.mockResolvedValue({ ok: true, shippingZoneRule: { id: "zone_1" } });
  serviceMocks.getLaunchTemplate.mockResolvedValue({ ok: true, launchTemplate: { id: "template_1" } });
  serviceMocks.updateShippingZoneRule.mockResolvedValue({ ok: true, shippingZoneRule: { id: "zone_1" } });
  serviceMocks.updateLaunchGuardrailProfile.mockResolvedValue({ ok: true, launchGuardrailProfile: { id: "guard_1" } });
  serviceMocks.listLaunchGuardrailProfiles.mockResolvedValue({ ok: true, launchGuardrailProfiles: [] });
  serviceMocks.listLaunchTemplates.mockResolvedValue({ ok: true, launchTemplates: [] });
  serviceMocks.listListingPrepPackages.mockResolvedValue({ ok: true, listingPrepPackages: [] });
  serviceMocks.calculateShelfCostView.mockResolvedValue({ ok: true, calculation: { subtotalCostCents: 1000 } });
  serviceMocks.compareShelfCostScenarios.mockResolvedValue({ ok: true, comparison: { scenarios: [] } });
  serviceMocks.evaluateComparisonSetGuardrails.mockResolvedValue({ ok: true, comparisonSet: { id: "set_1" } });
  serviceMocks.evaluateComparisonSetListingReadiness.mockResolvedValue({ ok: true, comparisonSet: { id: "set_1" } });
  serviceMocks.rankComparisonSet.mockResolvedValue({ ok: true, comparisonSet: { id: "set_1" } });
  serviceMocks.selectLaunchScenario.mockResolvedValue({ ok: true, comparisonSet: { id: "set_1" } });
  serviceMocks.evaluateMarketplaceFieldValidation.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.applyChannelMappingPresetToPackage.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.approveListingPrepPackage.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.requestPriceFloorOverride.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.refreshListingPrepPackage.mockResolvedValue({ ok: true, listingPrepPackage: { id: "package_1" } });
  serviceMocks.saveShelfCostCalculation.mockResolvedValue({ ok: true, calculation: { id: "calc_1" } });
  serviceMocks.listShelfCostCalculations.mockResolvedValue({ ok: true, calculations: [] });
  serviceMocks.getShelfCostCalculation.mockResolvedValue({ ok: true, calculation: { id: "calc_1" } });
  serviceMocks.saveComparisonSet.mockResolvedValue({ ok: true, comparisonSet: { id: "set_1" } });
  serviceMocks.listComparisonSets.mockResolvedValue({ ok: true, comparisonSets: [] });
  serviceMocks.getComparisonSet.mockResolvedValue({ ok: true, comparisonSet: { id: "set_1" } });
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error: Error | undefined) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

describe("cost engine routes", () => {
  it("lists cost profiles in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles`);
    expect(response.status).toBe(200);
    expect(serviceMocks.listCostProfiles).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board"
    });
  });

  it("creates a cost profile", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Hugo Base" })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.createCostProfile).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      name: "Hugo Base"
    });
  });

  it("creates a material rule in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles/profile_1/material-rules`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        materialCode: "WHITE_MELAMINE_075",
        materialName: "White Melamine 3/4",
        sheetLengthIn: 96,
        sheetWidthIn: 48,
        sheetCostCents: 6500
      })
    });
    expect(response.status).toBe(201);
  });

  it("calculates shelf cost in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-calculations/calculate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        costProfileId: "profile_1",
        quantity: 1,
        lengthIn: 30,
        depthIn: 12,
        materialCode: "WHITE_MELAMINE_075",
        edgeBandPattern: "NONE",
        laborMinutes: 10,
        machineMinutes: 8,
        packingMinutes: 6,
        marketplaceFeePct: 15,
        returnReservePct: 2,
        damageReservePct: 1,
        shippingBufferPct: 5
      })
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.calculateShelfCostView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      quantity: 1,
      lengthIn: 30,
      depthIn: 12,
      materialCode: "WHITE_MELAMINE_075",
      edgeBandPattern: "NONE",
      laborMinutes: 10,
      machineMinutes: 8,
      packingMinutes: 6,
      marketplaceFeePct: 15,
      returnReservePct: 2,
      damageReservePct: 1,
      shippingBufferPct: 5
    });
  });

  it("creates amazon fee presets in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles/profile_1/amazon-fee-presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Amazon Standard", referralFeePct: 15 })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.createAmazonFeePreset).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Amazon Standard",
      referralFeePct: 15
    });
  });

  it("creates launch guardrail profiles in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles/profile_1/launch-guardrail-profiles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Balanced guardrails", minimumMarginPct: 20 })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.createLaunchGuardrailProfile).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Balanced guardrails",
      minimumMarginPct: 20
    });
  });

  it("compares cost scenarios", async () => {
    const response = await fetch(`${baseUrl}/cost-calculations/compare`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseSpec: {
          costProfileId: "profile_1",
          quantity: 1,
          lengthIn: 30,
          depthIn: 12,
          materialCode: "WHITE_MELAMINE_075",
          edgeBandPattern: "NONE",
          laborMinutes: 10,
          machineMinutes: 8
        },
        scenarios: [{ name: "Baseline" }]
      })
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.compareShelfCostScenarios).toHaveBeenCalled();
  });

  it("creates launch templates in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles/profile_1/launch-templates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Balanced launch", launchStrategy: "BALANCED" })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.createLaunchTemplate).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Balanced launch",
      launchStrategy: "BALANCED"
    });
  });

  it("creates marketplace mapping templates in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles/profile_1/marketplace-mapping-templates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Amazon balanced export", productLabelFormat: "{productLabel}" })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.createMarketplaceMappingTemplate).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Amazon balanced export",
      productLabelFormat: "{productLabel}"
    });
  });

  it("creates channel mapping presets in org scope", async () => {
    const response = await fetch(`${baseUrl}/cost-profiles/profile_1/channel-mapping-presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Amazon manual preset", channelCode: "AMAZON_MANUAL" })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.createChannelMappingPreset).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1",
      name: "Amazon manual preset",
      channelCode: "AMAZON_MANUAL"
    });
  });

  it("lists channel mapping presets", async () => {
    const response = await fetch(`${baseUrl}/channel-mapping-presets?costProfileId=profile_1`);
    expect(response.status).toBe(200);
    expect(serviceMocks.listChannelMappingPresets).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1"
    });
  });

  it("lists marketplace mapping templates", async () => {
    const response = await fetch(`${baseUrl}/marketplace-mapping-templates?costProfileId=profile_1`);
    expect(response.status).toBe(200);
    expect(serviceMocks.listMarketplaceMappingTemplates).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1"
    });
  });

  it("saves comparison sets", async () => {
    const response = await fetch(`${baseUrl}/cost-comparison-sets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Launch compare",
        baseSpec: {
          costProfileId: "profile_1",
          quantity: 1,
          lengthIn: 30,
          depthIn: 12,
          materialCode: "WHITE_MELAMINE_075",
          edgeBandPattern: "NONE",
          laborMinutes: 10,
          machineMinutes: 8
        },
        scenarios: [{ name: "Baseline" }]
      })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.saveComparisonSet).toHaveBeenCalled();
  });

  it("reranks a saved comparison set", async () => {
    const response = await fetch(`${baseUrl}/cost-comparison-sets/set_1/rank`, {
      method: "POST"
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.rankComparisonSet).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      comparisonSetId: "set_1",
      guardrailProfileId: null,
      selectedScenarioId: null
    });
  });

  it("evaluates listing readiness for a saved comparison set", async () => {
    const response = await fetch(`${baseUrl}/cost-comparison-sets/set_1/listing-readiness`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ selectedScenarioId: "scenario_1" })
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.evaluateComparisonSetListingReadiness).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      comparisonSetId: "set_1",
      selectedScenarioId: "scenario_1"
    });
  });

  it("returns export summary for a saved comparison set", async () => {
    const response = await fetch(`${baseUrl}/cost-comparison-sets/set_1/export-summary`);
    expect(response.status).toBe(200);
    expect(serviceMocks.getComparisonSetExportSummary).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      comparisonSetId: "set_1"
    });
  });

  it("builds a listing-prep package for a saved comparison set", async () => {
    const response = await fetch(`${baseUrl}/cost-comparison-sets/set_1/listing-prep-package`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        selectedScenarioId: "scenario_1",
        notes: "Prep for listing",
        marketplaceMappingTemplateId: "mapping_1",
        channelMappingPresetId: "channel_1"
      })
    });
    expect(response.status).toBe(201);
    expect(serviceMocks.buildListingPrepPackage).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      comparisonSetId: "set_1",
      selectedScenarioId: "scenario_1",
      notes: "Prep for listing",
      marketplaceMappingTemplateId: "mapping_1",
      channelMappingPresetId: "channel_1"
    });
  });

  it("lists listing-prep packages", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages?status=READY`);
    expect(response.status).toBe(200);
    expect(serviceMocks.listListingPrepPackages).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      status: "READY"
    });
  });

  it("validates marketplace fields for a listing-prep package", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages/package_1/validate-marketplace-fields`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes: "Rechecked after manual edits" })
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.evaluateMarketplaceFieldValidation).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      notes: "Rechecked after manual edits"
    });
  });

  it("records a price-floor override review for a listing-prep package", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages/package_1/price-floor-override`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "Intentional launch exception", approve: true })
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.requestPriceFloorOverride).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      reason: "Intentional launch exception",
      approve: true,
      approvedByMembershipId: "membership_local_brandon"
    });
  });

  it("refreshes a listing-prep package", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages/package_1/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.refreshListingPrepPackage).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      notes: null
    });
  });

  it("applies a channel preset to a listing-prep package", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages/package_1/apply-channel-preset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channelMappingPresetId: "channel_1" })
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.applyChannelMappingPresetToPackage).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      channelMappingPresetId: "channel_1"
    });
  });

  it("approves a listing-prep package", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages/package_1/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(200);
    expect(serviceMocks.approveListingPrepPackage).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1",
      approvedByMembershipId: "membership_local_brandon"
    });
  });

  it("returns the manual Amazon export contract for a listing-prep package", async () => {
    const response = await fetch(`${baseUrl}/listing-prep-packages/package_1/manual-amazon-export`);
    expect(response.status).toBe(200);
    expect(serviceMocks.getListingPrepManualAmazonExport).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      listingPrepPackageId: "package_1"
    });
  });

  it("lists saved calculations", async () => {
    const response = await fetch(`${baseUrl}/cost-calculations?costProfileId=profile_1`);
    expect(response.status).toBe(200);
    expect(serviceMocks.listShelfCostCalculations).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      costProfileId: "profile_1"
    });
  });

  it("returns 403 for capability failures", async () => {
    contextMocks.getCostProfileReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });
    const response = await fetch(`${baseUrl}/cost-profiles`);
    expect(response.status).toBe(403);
  });
});

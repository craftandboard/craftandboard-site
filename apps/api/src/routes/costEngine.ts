import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getCostCalculationReadContext,
  getCostCalculationWriteContext,
  getCostProfileReadContext,
  getCostProfileWriteContext
} from "../modules/costEngine/contextAdapter.js";
import {
  calculateShelfCostView,
  compareShelfCostScenarios,
  createAmazonFeePreset,
  createCostProfile,
  createEdgeBandCostRule,
  createLaunchGuardrailProfile,
  createLaunchTemplate,
  createChannelMappingPreset,
  createMarketplaceMappingTemplate,
  buildListingPrepPackage,
  createMaterialCostRule,
  createPackagingCostRule,
  createShippingCostRule,
  createShippingZoneRule,
  evaluateMarketplaceFieldValidation,
  getAmazonFeePreset,
  getComparisonSet,
  getComparisonSetExportSummary,
  getComparisonSetHandoffSummary,
  getCostProfile,
  getComparisonSetRecommendation,
  getLaunchGuardrailProfile,
  getLaunchTemplate,
  getChannelMappingPreset,
  getListingPrepPackage,
  getManualListingWorksheet,
  getListingPrepManualAmazonExport,
  getMarketplaceMappingTemplate,
  getShelfCostCalculation,
  getShippingZoneRule,
  listAmazonFeePresets,
  listComparisonSets,
  listCostProfiles,
  listLaunchGuardrailProfiles,
  listLaunchTemplates,
  listChannelMappingPresets,
  listListingPrepPackages,
  listMarketplaceMappingTemplates,
  listShelfCostCalculations,
  listShippingZoneRules,
  requestPriceFloorOverride,
  refreshListingPrepPackage,
  applyChannelMappingPresetToPackage,
  applyDefaultChannelMappingPreset,
  approveListingPrepPackage,
  saveComparisonSet,
  saveShelfCostCalculation,
  rankComparisonSet,
  selectLaunchScenario,
  evaluateComparisonSetGuardrails,
  evaluateComparisonSetListingReadiness,
  updateAmazonFeePreset,
  updateCostProfile,
  updateEdgeBandCostRule,
  updateLaunchGuardrailProfile,
  updateLaunchTemplate,
  updateChannelMappingPreset,
  updateMaterialCostRule,
  updateMarketplaceMappingTemplate,
  updatePackagingCostRule,
  updateShippingCostRule,
  updateShippingZoneRule
} from "../modules/costEngine/service.js";
import {
  calculateShelfCostSchema,
  calculationIdParamsSchema,
  compareShelfCostScenariosSchema,
  comparisonSetIdParamsSchema,
  costProfileIdParamsSchema,
  buildListingPrepPackageSchema,
  createAmazonFeePresetSchema,
  createCostProfileSchema,
  createEdgeBandCostRuleSchema,
  createLaunchGuardrailProfileSchema,
  createLaunchTemplateSchema,
  createChannelMappingPresetSchema,
  createMarketplaceMappingTemplateSchema,
  createMaterialCostRuleSchema,
  createPackagingCostRuleSchema,
  createShippingCostRuleSchema,
  createShippingZoneRuleSchema,
  listAmazonFeePresetsQuerySchema,
  listLaunchGuardrailProfilesQuerySchema,
  listShelfCostCalculationsQuerySchema,
  listShippingZoneRulesQuerySchema,
  materialRuleIdParamsSchema,
  edgeBandRuleIdParamsSchema,
  listingPrepPackageIdParamsSchema,
  listChannelMappingPresetsQuerySchema,
  listListingPrepPackagesQuerySchema,
  listMarketplaceMappingTemplatesQuerySchema,
  channelMappingPresetIdParamsSchema,
  mappingTemplateIdParamsSchema,
  packagingRuleIdParamsSchema,
  presetIdParamsSchema,
  priceFloorOverrideSchema,
  refreshListingPrepPackageSchema,
  applyChannelMappingPresetSchema,
  applyDefaultChannelPresetSchema,
  approveListingPrepPackageSchema,
  saveComparisonSetSchema,
  saveShelfCostCalculationSchema,
  shippingRuleIdParamsSchema,
  updateAmazonFeePresetSchema,
  updateCostProfileSchema,
  updateEdgeBandCostRuleSchema,
  updateLaunchGuardrailProfileSchema,
  updateLaunchTemplateSchema,
  updateChannelMappingPresetSchema,
  updateMarketplaceMappingTemplateSchema,
  updateMaterialCostRuleSchema,
  updatePackagingCostRuleSchema,
  updateShippingCostRuleSchema,
  updateShippingZoneRuleSchema,
  validateMarketplaceFieldsSchema,
  zoneRuleIdParamsSchema,
  templateIdParamsSchema,
  guardrailProfileIdParamsSchema,
  evaluateGuardrailsSchema,
  evaluateListingReadinessSchema,
  selectLaunchScenarioSchema
} from "../modules/costEngine/schemas.js";

const router = Router();

function handleCostEngineRouteError(error: unknown, res: any, next: any) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.issues[0]?.message ?? error.message });
    return;
  }
  if (error instanceof Error) {
    const notFoundErrors = new Set([
      "Cost profile not found.",
      "Shelf cost calculation not found.",
      "Amazon fee preset not found.",
      "Shipping zone rule not found.",
      "Cost comparison set not found.",
      "Launch template not found.",
      "Launch guardrail profile not found.",
      "Marketplace mapping template not found.",
      "Channel mapping preset not found.",
      "Listing prep package not found."
    ]);
    res.status(notFoundErrors.has(error.message) ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/cost-profiles", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const body = createCostProfileSchema.parse(req.body);
    res.status(201).json(await createCostProfile({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-profiles", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    res.json(await listCostProfiles({ organizationId: context.currentOrganization.id }));
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-profiles/:costProfileId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    res.json(
      await getCostProfile({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/cost-profiles/:costProfileId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = updateCostProfileSchema.parse(req.body);
    res.json(
      await updateCostProfile({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/material-rules", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createMaterialCostRuleSchema.parse(req.body);
    res.status(201).json(
      await createMaterialCostRule({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/material-rules/:materialRuleId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = materialRuleIdParamsSchema.parse(req.params);
    const body = updateMaterialCostRuleSchema.parse(req.body);
    res.json(
      await updateMaterialCostRule({
        organizationId: context.currentOrganization.id,
        materialRuleId: params.materialRuleId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/edge-band-rules", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createEdgeBandCostRuleSchema.parse(req.body);
    res.status(201).json(
      await createEdgeBandCostRule({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/edge-band-rules/:edgeBandRuleId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = edgeBandRuleIdParamsSchema.parse(req.params);
    const body = updateEdgeBandCostRuleSchema.parse(req.body);
    res.json(
      await updateEdgeBandCostRule({
        organizationId: context.currentOrganization.id,
        edgeBandRuleId: params.edgeBandRuleId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/packaging-rules", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createPackagingCostRuleSchema.parse(req.body);
    res.status(201).json(
      await createPackagingCostRule({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/packaging-rules/:packagingRuleId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = packagingRuleIdParamsSchema.parse(req.params);
    const body = updatePackagingCostRuleSchema.parse(req.body);
    res.json(
      await updatePackagingCostRule({
        organizationId: context.currentOrganization.id,
        packagingRuleId: params.packagingRuleId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/shipping-rules", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createShippingCostRuleSchema.parse(req.body);
    res.status(201).json(
      await createShippingCostRule({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/shipping-rules/:shippingRuleId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = shippingRuleIdParamsSchema.parse(req.params);
    const body = updateShippingCostRuleSchema.parse(req.body);
    res.json(
      await updateShippingCostRule({
        organizationId: context.currentOrganization.id,
        shippingRuleId: params.shippingRuleId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/amazon-fee-presets", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createAmazonFeePresetSchema.parse(req.body);
    res.status(201).json(
      await createAmazonFeePreset({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/amazon-fee-presets", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const query = listAmazonFeePresetsQuerySchema.parse(req.query);
    res.json(
      await listAmazonFeePresets({
        organizationId: context.currentOrganization.id,
        costProfileId: query.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/amazon-fee-presets/:presetId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = presetIdParamsSchema.parse(req.params);
    res.json(
      await getAmazonFeePreset({
        organizationId: context.currentOrganization.id,
        presetId: params.presetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/amazon-fee-presets/:presetId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = presetIdParamsSchema.parse(req.params);
    const body = updateAmazonFeePresetSchema.parse(req.body);
    res.json(
      await updateAmazonFeePreset({
        organizationId: context.currentOrganization.id,
        presetId: params.presetId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/shipping-zone-rules", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createShippingZoneRuleSchema.parse(req.body);
    res.status(201).json(
      await createShippingZoneRule({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/shipping-zone-rules", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const query = listShippingZoneRulesQuerySchema.parse(req.query);
    res.json(
      await listShippingZoneRules({
        organizationId: context.currentOrganization.id,
        costProfileId: query.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/shipping-zone-rules/:zoneRuleId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = zoneRuleIdParamsSchema.parse(req.params);
    res.json(
      await getShippingZoneRule({
        organizationId: context.currentOrganization.id,
        zoneRuleId: params.zoneRuleId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/shipping-zone-rules/:zoneRuleId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = zoneRuleIdParamsSchema.parse(req.params);
    const body = updateShippingZoneRuleSchema.parse(req.body);
    res.json(
      await updateShippingZoneRule({
        organizationId: context.currentOrganization.id,
        zoneRuleId: params.zoneRuleId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/launch-templates", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createLaunchTemplateSchema.parse(req.body);
    res.status(201).json(
      await createLaunchTemplate({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/launch-templates", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const query = listAmazonFeePresetsQuerySchema.parse(req.query);
    res.json(
      await listLaunchTemplates({
        organizationId: context.currentOrganization.id,
        costProfileId: query.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/launch-templates/:templateId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = templateIdParamsSchema.parse(req.params);
    res.json(
      await getLaunchTemplate({
        organizationId: context.currentOrganization.id,
        templateId: params.templateId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/launch-templates/:templateId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = templateIdParamsSchema.parse(req.params);
    const body = updateLaunchTemplateSchema.parse(req.body);
    res.json(
      await updateLaunchTemplate({
        organizationId: context.currentOrganization.id,
        templateId: params.templateId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/launch-guardrail-profiles", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createLaunchGuardrailProfileSchema.parse(req.body);
    res.status(201).json(
      await createLaunchGuardrailProfile({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/launch-guardrail-profiles", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const query = listLaunchGuardrailProfilesQuerySchema.parse(req.query);
    res.json(
      await listLaunchGuardrailProfiles({
        organizationId: context.currentOrganization.id,
        costProfileId: query.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/launch-guardrail-profiles/:guardrailProfileId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = guardrailProfileIdParamsSchema.parse(req.params);
    res.json(
      await getLaunchGuardrailProfile({
        organizationId: context.currentOrganization.id,
        guardrailProfileId: params.guardrailProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/launch-guardrail-profiles/:guardrailProfileId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = guardrailProfileIdParamsSchema.parse(req.params);
    const body = updateLaunchGuardrailProfileSchema.parse(req.body);
    res.json(
      await updateLaunchGuardrailProfile({
        organizationId: context.currentOrganization.id,
        guardrailProfileId: params.guardrailProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/marketplace-mapping-templates", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createMarketplaceMappingTemplateSchema.parse(req.body);
    res.status(201).json(
      await createMarketplaceMappingTemplate({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/marketplace-mapping-templates", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const query = listMarketplaceMappingTemplatesQuerySchema.parse(req.query);
    res.json(
      await listMarketplaceMappingTemplates({
        organizationId: context.currentOrganization.id,
        costProfileId: query.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/marketplace-mapping-templates/:mappingTemplateId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = mappingTemplateIdParamsSchema.parse(req.params);
    res.json(
      await getMarketplaceMappingTemplate({
        organizationId: context.currentOrganization.id,
        mappingTemplateId: params.mappingTemplateId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/marketplace-mapping-templates/:mappingTemplateId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = mappingTemplateIdParamsSchema.parse(req.params);
    const body = updateMarketplaceMappingTemplateSchema.parse(req.body);
    res.json(
      await updateMarketplaceMappingTemplate({
        organizationId: context.currentOrganization.id,
        mappingTemplateId: params.mappingTemplateId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-profiles/:costProfileId/channel-mapping-presets", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = costProfileIdParamsSchema.parse(req.params);
    const body = createChannelMappingPresetSchema.parse(req.body);
    res.status(201).json(
      await createChannelMappingPreset({
        organizationId: context.currentOrganization.id,
        costProfileId: params.costProfileId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/channel-mapping-presets", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const query = listChannelMappingPresetsQuerySchema.parse(req.query);
    res.json(
      await listChannelMappingPresets({
        organizationId: context.currentOrganization.id,
        costProfileId: query.costProfileId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/channel-mapping-presets/:channelMappingPresetId", async (req, res, next) => {
  try {
    const context = getCostProfileReadContext(req);
    const params = channelMappingPresetIdParamsSchema.parse(req.params);
    res.json(
      await getChannelMappingPreset({
        organizationId: context.currentOrganization.id,
        channelMappingPresetId: params.channelMappingPresetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.patch("/channel-mapping-presets/:channelMappingPresetId", async (req, res, next) => {
  try {
    const context = getCostProfileWriteContext(req);
    const params = channelMappingPresetIdParamsSchema.parse(req.params);
    const body = updateChannelMappingPresetSchema.parse(req.body);
    res.json(
      await updateChannelMappingPreset({
        organizationId: context.currentOrganization.id,
        channelMappingPresetId: params.channelMappingPresetId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-calculations/calculate", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const body = calculateShelfCostSchema.parse(req.body);
    res.json(await calculateShelfCostView({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-calculations/compare", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const body = compareShelfCostScenariosSchema.parse(req.body);
    res.json(
      await compareShelfCostScenarios({
        organizationId: context.currentOrganization.id,
        ...body,
        baseSpec: { ...body.baseSpec, organizationId: context.currentOrganization.id }
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-calculations", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const body = saveShelfCostCalculationSchema.parse(req.body);
    res.status(201).json(
      await saveShelfCostCalculation({ organizationId: context.currentOrganization.id, ...body })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-calculations", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const query = listShelfCostCalculationsQuerySchema.parse(req.query);
    res.json(await listShelfCostCalculations({ organizationId: context.currentOrganization.id, ...query }));
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-calculations/:calculationId", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = calculationIdParamsSchema.parse(req.params);
    res.json(
      await getShelfCostCalculation({
        organizationId: context.currentOrganization.id,
        calculationId: params.calculationId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-comparison-sets", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const body = saveComparisonSetSchema.parse(req.body);
    res.status(201).json(
      await saveComparisonSet({
        organizationId: context.currentOrganization.id,
        ...body,
        baseSpec: { ...body.baseSpec, organizationId: context.currentOrganization.id }
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-comparison-sets", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    res.json(await listComparisonSets({ organizationId: context.currentOrganization.id }));
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-comparison-sets/:comparisonSetId", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    res.json(
      await getComparisonSet({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-comparison-sets/:comparisonSetId/rank", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    const body = evaluateGuardrailsSchema.partial().parse(req.body ?? {});
    res.json(
      await rankComparisonSet({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId,
        guardrailProfileId: body.guardrailProfileId ?? null,
        selectedScenarioId: body.selectedScenarioId ?? null
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-comparison-sets/:comparisonSetId/guardrails", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    const body = evaluateGuardrailsSchema.parse(req.body);
    res.json(
      await evaluateComparisonSetGuardrails({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId,
        guardrailProfileId: body.guardrailProfileId,
        selectedScenarioId: body.selectedScenarioId ?? null
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-comparison-sets/:comparisonSetId/select-launch-scenario", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    const body = selectLaunchScenarioSchema.parse(req.body);
    res.json(
      await selectLaunchScenario({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId,
        scenarioId: body.scenarioId,
        guardrailProfileId: body.guardrailProfileId ?? null
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-comparison-sets/:comparisonSetId/listing-readiness", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    const body = evaluateListingReadinessSchema.parse(req.body ?? {});
    res.json(
      await evaluateComparisonSetListingReadiness({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId,
        selectedScenarioId: body.selectedScenarioId ?? null
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-comparison-sets/:comparisonSetId/recommendation", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    res.json(
      await getComparisonSetRecommendation({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-comparison-sets/:comparisonSetId/handoff-summary", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    res.json(
      await getComparisonSetHandoffSummary({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/cost-comparison-sets/:comparisonSetId/export-summary", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    res.json(
      await getComparisonSetExportSummary({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/cost-comparison-sets/:comparisonSetId/listing-prep-package", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = comparisonSetIdParamsSchema.parse(req.params);
    const body = buildListingPrepPackageSchema.parse(req.body);
    res.status(201).json(
      await buildListingPrepPackage({
        organizationId: context.currentOrganization.id,
        comparisonSetId: params.comparisonSetId,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/listing-prep-packages/:listingPrepPackageId/refresh", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    const body = refreshListingPrepPackageSchema.parse(req.body ?? {});
    res.json(
      await refreshListingPrepPackage({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId,
        notes: body.notes ?? null
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post("/listing-prep-packages/:listingPrepPackageId/apply-channel-preset", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    const body = applyChannelMappingPresetSchema.parse(req.body);
    res.json(
      await applyChannelMappingPresetToPackage({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId,
        channelMappingPresetId: body.channelMappingPresetId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post(
  "/listing-prep-packages/:listingPrepPackageId/apply-default-channel-preset",
  async (req, res, next) => {
    try {
      const context = getCostCalculationWriteContext(req);
      const params = listingPrepPackageIdParamsSchema.parse(req.params);
      applyDefaultChannelPresetSchema.parse(req.body ?? {});
      res.json(
        await applyDefaultChannelMappingPreset({
          organizationId: context.currentOrganization.id,
          listingPrepPackageId: params.listingPrepPackageId
        })
      );
    } catch (error) {
      handleCostEngineRouteError(error, res, next);
    }
  }
);

router.post("/listing-prep-packages/:listingPrepPackageId/approve", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    approveListingPrepPackageSchema.parse(req.body ?? {});
    res.json(
      await approveListingPrepPackage({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId,
        approvedByMembershipId: (context as any).currentMembership?.id ?? null
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/listing-prep-packages", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const query = listListingPrepPackagesQuerySchema.parse(req.query);
    res.json(
      await listListingPrepPackages({
        organizationId: context.currentOrganization.id,
        ...query
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/listing-prep-packages/:listingPrepPackageId", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    res.json(
      await getListingPrepPackage({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/listing-prep-packages/:listingPrepPackageId/manual-amazon-export", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    res.json(
      await getListingPrepManualAmazonExport({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.get("/listing-prep-packages/:listingPrepPackageId/manual-listing-worksheet", async (req, res, next) => {
  try {
    const context = getCostCalculationReadContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    res.json(
      await getManualListingWorksheet({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

router.post(
  "/listing-prep-packages/:listingPrepPackageId/validate-marketplace-fields",
  async (req, res, next) => {
    try {
      const context = getCostCalculationWriteContext(req);
      const params = listingPrepPackageIdParamsSchema.parse(req.params);
      const body = validateMarketplaceFieldsSchema.parse(req.body);
      res.json(
        await evaluateMarketplaceFieldValidation({
          organizationId: context.currentOrganization.id,
          listingPrepPackageId: params.listingPrepPackageId,
          ...body
        })
      );
    } catch (error) {
      handleCostEngineRouteError(error, res, next);
    }
  }
);

router.post("/listing-prep-packages/:listingPrepPackageId/price-floor-override", async (req, res, next) => {
  try {
    const context = getCostCalculationWriteContext(req);
    const params = listingPrepPackageIdParamsSchema.parse(req.params);
    const body = priceFloorOverrideSchema.parse(req.body);
    res.json(
      await requestPriceFloorOverride({
        organizationId: context.currentOrganization.id,
        listingPrepPackageId: params.listingPrepPackageId,
        approvedByMembershipId: (context as any).currentMembership?.id ?? null,
        ...body
      })
    );
  } catch (error) {
    handleCostEngineRouteError(error, res, next);
  }
});

export default router;

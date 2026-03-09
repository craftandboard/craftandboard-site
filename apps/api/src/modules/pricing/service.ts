import { prisma } from "../../lib/prisma.js";
import { ensureDefaultProfiles, getMaterialProfile } from "../settings/service.js";
import { ensureCostProfileOwnership, latestRatesByKey } from "../costing/service.js";
import { listActiveCostRates } from "../costing/repository.js";
import { calculateShelfPricing } from "./calculator.js";
import {
  createPackagingProfile,
  createPricingPolicy,
  createPricingScenario,
  createProductionAssumptionProfile,
  createShelfProduct,
  getPackagingProfileById,
  getPricingPolicyById,
  getProductionAssumptionProfileById,
  getShelfProductById,
  listPackagingProfiles,
  listPricingPolicies,
  listProductionAssumptionProfiles,
  listShelfProducts,
  updatePackagingProfile,
  updatePricingPolicy,
  updateProductionAssumptionProfile,
  updateShelfProduct
} from "./repository.js";

async function ensureShelfProductOwnership(id: string, organizationId: string) {
  const product = await getShelfProductById(id, organizationId);
  if (!product) {
    throw new Error("Shelf product not found.");
  }
  return product;
}

async function ensureProductionAssumptionOwnership(id: string, organizationId: string) {
  const profile = await getProductionAssumptionProfileById(id, organizationId);
  if (!profile) {
    throw new Error("Production assumption profile not found.");
  }
  return profile;
}

async function ensurePackagingProfileOwnership(id: string, organizationId: string) {
  const profile = await getPackagingProfileById(id, organizationId);
  if (!profile) {
    throw new Error("Packaging profile not found.");
  }
  return profile;
}

async function ensurePricingPolicyOwnership(id: string, organizationId: string) {
  const policy = await getPricingPolicyById(id, organizationId);
  if (!policy) {
    throw new Error("Pricing policy not found.");
  }
  return policy;
}

function mapShelfProduct(product: Awaited<ReturnType<typeof prisma.shelfProduct.findFirstOrThrow>>) {
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    materialType: product.materialType,
    defaultThicknessIn: Number(product.defaultThicknessIn),
    defaultEdgeBandPattern: product.defaultEdgeBandPattern,
    packagingProfileId: product.packagingProfileId ?? undefined,
    isActive: product.isActive,
    notes: product.notes ?? undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

function mapProductionAssumptionProfile(profile: Awaited<ReturnType<typeof prisma.productionAssumptionProfile.findFirstOrThrow>>) {
  return {
    id: profile.id,
    name: profile.name,
    isDefault: profile.isDefault,
    cncLoadMinutesPerRun: Number(profile.cncLoadMinutesPerRun),
    cncUnloadMinutesPerRun: Number(profile.cncUnloadMinutesPerRun),
    cncRunMinutesPerUnit: Number(profile.cncRunMinutesPerUnit),
    edgebanderSetupMinutesPerRun: Number(profile.edgebanderSetupMinutesPerRun),
    edgebanderRunMinutesPerLinearFt: Number(profile.edgebanderRunMinutesPerLinearFt),
    handlingMinutesPerUnit: Number(profile.handlingMinutesPerUnit),
    packagingMinutesPerUnit: Number(profile.packagingMinutesPerUnit),
    qcMinutesPerUnit: profile.qcMinutesPerUnit ? Number(profile.qcMinutesPerUnit) : 0,
    notes: profile.notes ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function mapPackagingProfile(profile: Awaited<ReturnType<typeof prisma.packagingProfile.findFirstOrThrow>>) {
  return {
    id: profile.id,
    name: profile.name,
    boxCostCentsPerUnit: profile.boxCostCentsPerUnit,
    bubbleWrapCostCentsPerUnit: profile.bubbleWrapCostCentsPerUnit,
    shrinkWrapCostCentsPerUnit: profile.shrinkWrapCostCentsPerUnit,
    tapeCostCentsPerUnit: profile.tapeCostCentsPerUnit,
    labelCostCentsPerUnit: profile.labelCostCentsPerUnit,
    insertFlyerCostCentsPerUnit: profile.insertFlyerCostCentsPerUnit,
    otherPackagingCostCentsPerUnit: profile.otherPackagingCostCentsPerUnit,
    notes: profile.notes ?? undefined,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function mapPricingPolicy(policy: Awaited<ReturnType<typeof prisma.pricingPolicy.findFirstOrThrow>>) {
  return {
    id: policy.id,
    name: policy.name,
    isDefault: policy.isDefault,
    manufacturingMarkupPercent: Number(policy.manufacturingMarkupPercent),
    minimumChargeCentsPerUnit: policy.minimumChargeCentsPerUnit ?? undefined,
    minimumRunChargeCents: policy.minimumRunChargeCents ?? undefined,
    roundingMode: policy.roundingMode,
    roundToCents: policy.roundToCents ?? undefined,
    notes: policy.notes ?? undefined,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString()
  };
}

export async function getShelfProducts(organizationId: string) {
  await ensureDefaultProfiles();
  const items = await listShelfProducts(organizationId);
  return { ok: true as const, shelfProducts: items.map(mapShelfProduct) };
}

export async function createShelfProductRecord(input: Parameters<typeof createShelfProduct>[0]) {
  const product = await createShelfProduct(input);
  return { ok: true as const, shelfProduct: mapShelfProduct(product) };
}

export async function updateShelfProductRecord(id: string, input: Parameters<typeof updateShelfProduct>[1] & { organizationId: string }) {
  await ensureShelfProductOwnership(id, input.organizationId);
  const product = await updateShelfProduct(id, input);
  return { ok: true as const, shelfProduct: mapShelfProduct(product) };
}

export async function getProductionAssumptionProfiles(organizationId: string) {
  await ensureDefaultProfiles();
  const items = await listProductionAssumptionProfiles(organizationId);
  return { ok: true as const, profiles: items.map(mapProductionAssumptionProfile) };
}

export async function createProductionAssumptionProfileRecord(input: Parameters<typeof createProductionAssumptionProfile>[0]) {
  const profile = await createProductionAssumptionProfile(input);
  return { ok: true as const, profile: mapProductionAssumptionProfile(profile) };
}

export async function updateProductionAssumptionProfileRecord(
  id: string,
  input: Parameters<typeof updateProductionAssumptionProfile>[1] & { organizationId: string }
) {
  await ensureProductionAssumptionOwnership(id, input.organizationId);
  const profile = await updateProductionAssumptionProfile(id, input);
  return { ok: true as const, profile: mapProductionAssumptionProfile(profile) };
}

export async function getPackagingProfiles(organizationId: string) {
  await ensureDefaultProfiles();
  const items = await listPackagingProfiles(organizationId);
  return { ok: true as const, profiles: items.map(mapPackagingProfile) };
}

export async function createPackagingProfileRecord(input: Parameters<typeof createPackagingProfile>[0]) {
  const profile = await createPackagingProfile(input);
  return { ok: true as const, profile: mapPackagingProfile(profile) };
}

export async function updatePackagingProfileRecord(id: string, input: Parameters<typeof updatePackagingProfile>[1] & { organizationId: string }) {
  await ensurePackagingProfileOwnership(id, input.organizationId);
  const profile = await updatePackagingProfile(id, input);
  return { ok: true as const, profile: mapPackagingProfile(profile) };
}

export async function getPricingPolicies(organizationId: string) {
  await ensureDefaultProfiles();
  const items = await listPricingPolicies(organizationId);
  return { ok: true as const, policies: items.map(mapPricingPolicy) };
}

export async function createPricingPolicyRecord(input: Parameters<typeof createPricingPolicy>[0]) {
  const policy = await createPricingPolicy(input);
  return { ok: true as const, policy: mapPricingPolicy(policy) };
}

export async function updatePricingPolicyRecord(id: string, input: Parameters<typeof updatePricingPolicy>[1] & { organizationId: string }) {
  await ensurePricingPolicyOwnership(id, input.organizationId);
  const policy = await updatePricingPolicy(id, input);
  return { ok: true as const, policy: mapPricingPolicy(policy) };
}

export async function calculatePricing(input: {
  shelfProductId?: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number;
  quantity: number;
  materialType?: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  edgeBandPattern?: "NONE" | "ONE_LONG_EDGE" | "TWO_LONG_EDGES" | "TWO_SHORT_EDGES" | "ALL_FOUR";
  requiresPackaging: boolean;
  includeScenarioSave?: boolean;
  scenarioName?: string;
}, organizationId: string, createdByUserId?: string) {
  await ensureDefaultProfiles();
  let shelfProduct = null;
  if (input.shelfProductId) {
    shelfProduct = await ensureShelfProductOwnership(input.shelfProductId, organizationId);
  }

  const productionProfile = await ensureProductionAssumptionOwnership(input.productionAssumptionProfileId, organizationId);
  const pricingPolicy = await ensurePricingPolicyOwnership(input.pricingPolicyId, organizationId);

  let packagingProfile = null;
  const resolvedPackagingProfileId = input.packagingProfileId ?? shelfProduct?.packagingProfileId ?? undefined;
  if (resolvedPackagingProfileId) {
    packagingProfile = await ensurePackagingProfileOwnership(resolvedPackagingProfileId, organizationId);
  }

  const costProfile = await ensureCostProfileOwnership(input.costProfileId, organizationId);

  const normalizedInput = {
    shelfProductId: shelfProduct?.id ?? undefined,
    costProfileId: input.costProfileId,
    productionAssumptionProfileId: productionProfile.id,
    packagingProfileId: packagingProfile?.id ?? undefined,
    pricingPolicyId: pricingPolicy.id,
    lengthIn: input.lengthIn,
    depthIn: input.depthIn,
    thicknessIn: input.thicknessIn ?? (shelfProduct ? Number(shelfProduct.defaultThicknessIn) : 0.75),
    quantity: input.quantity,
    materialType: input.materialType ?? (shelfProduct?.materialType as any),
    edgeBandPattern: input.edgeBandPattern ?? (shelfProduct?.defaultEdgeBandPattern as any),
    requiresPackaging: input.requiresPackaging
  };

  if (!normalizedInput.lengthIn || !normalizedInput.depthIn || !normalizedInput.materialType || !normalizedInput.edgeBandPattern) {
    throw new Error("Pricing calculation requires explicit product dimensions, material, and edge band pattern.");
  }

  const costRates = await listActiveCostRates(input.costProfileId, organizationId, new Date());
  const materialProfile = await getMaterialProfile(normalizedInput.materialType, organizationId).catch(() => null);

  const result = calculateShelfPricing({
    normalizedInput,
    product: shelfProduct ? { id: shelfProduct.id, name: shelfProduct.name, code: shelfProduct.code } : undefined,
    costProfile: {
      id: costProfile.id,
      name: costProfile.name,
      currency: costProfile.currency,
      isDefault: costProfile.isDefault
    },
    productionAssumptionProfile: {
      id: productionProfile.id,
      name: productionProfile.name,
      cncLoadMinutesPerRun: Number(productionProfile.cncLoadMinutesPerRun),
      cncUnloadMinutesPerRun: Number(productionProfile.cncUnloadMinutesPerRun),
      cncRunMinutesPerUnit: Number(productionProfile.cncRunMinutesPerUnit),
      edgebanderSetupMinutesPerRun: Number(productionProfile.edgebanderSetupMinutesPerRun),
      edgebanderRunMinutesPerLinearFt: Number(productionProfile.edgebanderRunMinutesPerLinearFt),
      handlingMinutesPerUnit: Number(productionProfile.handlingMinutesPerUnit),
      packagingMinutesPerUnit: Number(productionProfile.packagingMinutesPerUnit),
      qcMinutesPerUnit: productionProfile.qcMinutesPerUnit ? Number(productionProfile.qcMinutesPerUnit) : 0
    },
    packagingProfile: packagingProfile
      ? {
          id: packagingProfile.id,
          name: packagingProfile.name,
          boxCostCentsPerUnit: packagingProfile.boxCostCentsPerUnit,
          bubbleWrapCostCentsPerUnit: packagingProfile.bubbleWrapCostCentsPerUnit,
          shrinkWrapCostCentsPerUnit: packagingProfile.shrinkWrapCostCentsPerUnit,
          tapeCostCentsPerUnit: packagingProfile.tapeCostCentsPerUnit,
          labelCostCentsPerUnit: packagingProfile.labelCostCentsPerUnit,
          insertFlyerCostCentsPerUnit: packagingProfile.insertFlyerCostCentsPerUnit,
          otherPackagingCostCentsPerUnit: packagingProfile.otherPackagingCostCentsPerUnit
        }
      : undefined,
    pricingPolicy: {
      id: pricingPolicy.id,
      name: pricingPolicy.name,
      manufacturingMarkupPercent: Number(pricingPolicy.manufacturingMarkupPercent),
      minimumChargeCentsPerUnit: pricingPolicy.minimumChargeCentsPerUnit ?? undefined,
      minimumRunChargeCents: pricingPolicy.minimumRunChargeCents ?? undefined,
      roundingMode: pricingPolicy.roundingMode as any,
      roundToCents: pricingPolicy.roundToCents ?? undefined
    },
    materialProfile: materialProfile
      ? {
          sheetWidthIn: Number(materialProfile.sheetWidthIn),
          sheetDepthIn: Number(materialProfile.sheetDepthIn)
        }
      : undefined,
    baseRates: latestRatesByKey(costRates as any)
  });

  if (input.includeScenarioSave) {
    await createPricingScenario({
      organizationId,
      shelfProductId: shelfProduct?.id,
      costProfileId: input.costProfileId,
      productionAssumptionProfileId: productionProfile.id,
      packagingProfileId: packagingProfile?.id,
      pricingPolicyId: pricingPolicy.id,
      inputJson: input,
      resultJson: result,
      createdByUserId
    });
  }

  return { ok: true as const, result };
}

export async function createPricingScenarioSnapshot(input: {
  shelfProductId?: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  name?: string;
  sourceType: "MANUAL" | "CONFIGURATOR" | "ORDER" | "BATCH" | "FORECAST";
  sourceId?: string;
  input: {
    shelfProductId?: string;
    costProfileId: string;
    productionAssumptionProfileId: string;
    packagingProfileId?: string;
    pricingPolicyId: string;
    lengthIn: number;
    depthIn: number;
    thicknessIn?: number;
    quantity: number;
    materialType?: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    edgeBandPattern?: "NONE" | "ONE_LONG_EDGE" | "TWO_LONG_EDGES" | "TWO_SHORT_EDGES" | "ALL_FOUR";
    requiresPackaging: boolean;
  };
  createdByUserId?: string;
}, organizationId: string) {
  const pricing = await calculatePricing(input.input, organizationId, input.createdByUserId);
  const scenario = await createPricingScenario({
    organizationId,
    shelfProductId: input.input.shelfProductId,
    costProfileId: input.costProfileId,
    productionAssumptionProfileId: input.productionAssumptionProfileId,
    packagingProfileId: input.packagingProfileId,
    pricingPolicyId: input.pricingPolicyId,
    inputJson: {
      name: input.name,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      input: input.input
    },
    resultJson: pricing.result,
    createdByUserId: input.createdByUserId
  });

  return {
    ok: true as const,
    scenario: {
      id: scenario.id,
      createdAt: scenario.createdAt.toISOString()
    },
    result: pricing.result
  };
}

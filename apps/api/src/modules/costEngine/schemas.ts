import { z } from "zod";
import {
  COST_PROFILE_STATUSES,
  LAUNCH_STRATEGIES,
  SHELF_COST_EDGE_BAND_PATTERNS
} from "./contracts.js";

const percentSchema = z.number().min(0).max(100);
const nonNegativeCentsSchema = z.number().int().min(0);
const nullableNonNegativeCentsSchema = nonNegativeCentsSchema.nullable().optional();
const optionalNullableIdSchema = z.string().trim().min(1).nullable().optional();

export const costProfileStatusSchema = z.enum(COST_PROFILE_STATUSES);
export const shelfCostEdgeBandPatternSchema = z.enum(SHELF_COST_EDGE_BAND_PATTERNS);
export const launchStrategySchema = z.enum(LAUNCH_STRATEGIES);

export const costProfileIdParamsSchema = z.object({
  costProfileId: z.string().trim().min(1)
});

export const materialRuleIdParamsSchema = z.object({
  materialRuleId: z.string().trim().min(1)
});

export const edgeBandRuleIdParamsSchema = z.object({
  edgeBandRuleId: z.string().trim().min(1)
});

export const packagingRuleIdParamsSchema = z.object({
  packagingRuleId: z.string().trim().min(1)
});

export const shippingRuleIdParamsSchema = z.object({
  shippingRuleId: z.string().trim().min(1)
});

export const presetIdParamsSchema = z.object({
  presetId: z.string().trim().min(1)
});

export const zoneRuleIdParamsSchema = z.object({
  zoneRuleId: z.string().trim().min(1)
});

export const calculationIdParamsSchema = z.object({
  calculationId: z.string().trim().min(1)
});

export const comparisonSetIdParamsSchema = z.object({
  comparisonSetId: z.string().trim().min(1)
});

export const templateIdParamsSchema = z.object({
  templateId: z.string().trim().min(1)
});

export const createCostProfileSchema = z.object({
  name: z.string().trim().min(1).max(160),
  status: costProfileStatusSchema.optional(),
  currency: z.literal("USD").optional(),
  defaultMaterialWastePct: percentSchema.optional(),
  defaultEdgeBandWastePct: percentSchema.optional(),
  defaultLaborRateCentsPerHour: nonNegativeCentsSchema.optional(),
  defaultMachineRateCentsPerHour: nonNegativeCentsSchema.optional(),
  defaultOverheadRateCentsPerHour: nullableNonNegativeCentsSchema,
  defaultPackagingAllowanceCents: nullableNonNegativeCentsSchema,
  defaultShippingAllowanceCents: nullableNonNegativeCentsSchema,
  defaultPackingLaborRateCentsPerHour: nullableNonNegativeCentsSchema,
  defaultPackingMinutes: z.number().min(0).nullable().optional(),
  defaultMarketplaceFeePct: percentSchema.nullable().optional(),
  defaultReturnReservePct: percentSchema.nullable().optional(),
  defaultDamageReservePct: percentSchema.nullable().optional(),
  defaultShippingBufferPct: percentSchema.nullable().optional(),
  defaultShippingBufferCents: nullableNonNegativeCentsSchema,
  defaultPackagingOverheadCents: nullableNonNegativeCentsSchema,
  defaultRecommendedMinMarginPct: percentSchema.nullable().optional(),
  defaultRecommendedTargetMarginPct: percentSchema.nullable().optional(),
  targetMarginPct: percentSchema.nullable().optional(),
  growthMarginPct: percentSchema.nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  metadata: z.unknown().optional()
});

export const updateCostProfileSchema = createCostProfileSchema
  .omit({ name: true })
  .extend({ name: z.string().trim().min(1).max(160).optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one cost profile field must be provided."
  });

export const createMaterialCostRuleSchema = z.object({
  materialCode: z.string().trim().min(1).max(80),
  materialName: z.string().trim().min(1).max(160),
  thicknessLabel: z.string().trim().max(80).nullable().optional(),
  sheetLengthIn: z.number().positive(),
  sheetWidthIn: z.number().positive(),
  sheetCostCents: nonNegativeCentsSchema,
  usableYieldPct: percentSchema.nullable().optional(),
  wastePct: percentSchema.nullable().optional(),
  active: z.boolean().optional()
});

export const updateMaterialCostRuleSchema = createMaterialCostRuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one material rule field must be provided." }
);

export const createEdgeBandCostRuleSchema = z.object({
  edgeBandCode: z.string().trim().min(1).max(80),
  edgeBandName: z.string().trim().min(1).max(160),
  costCentsPerLinearFoot: nonNegativeCentsSchema,
  wastePct: percentSchema.nullable().optional(),
  setupAllowanceLinearFt: z.number().min(0).nullable().optional(),
  active: z.boolean().optional()
});

export const updateEdgeBandCostRuleSchema = createEdgeBandCostRuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one edge band rule field must be provided." }
);

export const createPackagingCostRuleSchema = z.object({
  packagingCode: z.string().trim().min(1).max(80),
  packagingName: z.string().trim().min(1).max(160),
  boxCostCents: nullableNonNegativeCentsSchema,
  bubbleWrapCostCents: nullableNonNegativeCentsSchema,
  tapeCostCents: nullableNonNegativeCentsSchema,
  labelCostCents: nullableNonNegativeCentsSchema,
  insertFlyerCostCents: nullableNonNegativeCentsSchema,
  shrinkWrapCostCents: nullableNonNegativeCentsSchema,
  foamCostCents: nullableNonNegativeCentsSchema,
  cornerProtectorCostCents: nullableNonNegativeCentsSchema,
  packingMinutes: z.number().min(0).nullable().optional(),
  packingLaborOverrideCents: nullableNonNegativeCentsSchema,
  packagingOverheadCents: nullableNonNegativeCentsSchema,
  otherPackagingCostCents: nullableNonNegativeCentsSchema,
  sortOrder: z.number().int().min(0).nullable().optional(),
  active: z.boolean().optional()
});

export const updatePackagingCostRuleSchema = createPackagingCostRuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one packaging rule field must be provided." }
);

export const createShippingCostRuleSchema = z.object({
  shippingCode: z.string().trim().min(1).max(80),
  shippingName: z.string().trim().min(1).max(160),
  baseCostCents: nonNegativeCentsSchema,
  costPerPoundCents: nullableNonNegativeCentsSchema,
  costPerCubicInchCents: nullableNonNegativeCentsSchema,
  dimensionalDivisor: z.number().positive().nullable().optional(),
  dimensionalRateCents: nullableNonNegativeCentsSchema,
  shippingBufferPct: percentSchema.nullable().optional(),
  shippingBufferCents: nullableNonNegativeCentsSchema,
  marketplaceHandlingCents: nullableNonNegativeCentsSchema,
  sortOrder: z.number().int().min(0).nullable().optional(),
  flatOverride: nullableNonNegativeCentsSchema,
  active: z.boolean().optional()
});

export const updateShippingCostRuleSchema = createShippingCostRuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one shipping rule field must be provided." }
);

export const createAmazonFeePresetSchema = z.object({
  name: z.string().trim().min(1).max(160),
  status: costProfileStatusSchema.optional(),
  referralFeePct: percentSchema,
  closingFeeCents: nullableNonNegativeCentsSchema,
  fulfillmentFeeCents: nullableNonNegativeCentsSchema,
  storageAllowanceCents: nullableNonNegativeCentsSchema,
  advertisingAllowancePct: percentSchema.nullable().optional(),
  advertisingAllowanceCents: nullableNonNegativeCentsSchema,
  returnReservePct: percentSchema.nullable().optional(),
  returnReserveCents: nullableNonNegativeCentsSchema,
  damageReservePct: percentSchema.nullable().optional(),
  damageReserveCents: nullableNonNegativeCentsSchema,
  miscMarketplacePct: percentSchema.nullable().optional(),
  miscMarketplaceCents: nullableNonNegativeCentsSchema,
  notes: z.string().trim().max(4000).nullable().optional(),
  metadata: z.unknown().optional()
});

export const updateAmazonFeePresetSchema = createAmazonFeePresetSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one Amazon fee preset field must be provided." }
);

export const createShippingZoneRuleSchema = z.object({
  name: z.string().trim().min(1).max(160),
  zoneCode: z.string().trim().min(1).max(80),
  status: costProfileStatusSchema.optional(),
  baseCostCents: nonNegativeCentsSchema,
  weightAdderCents: nullableNonNegativeCentsSchema,
  dimensionalAdderCents: nullableNonNegativeCentsSchema,
  bufferPct: percentSchema.nullable().optional(),
  bufferCents: nullableNonNegativeCentsSchema,
  marketplaceHandlingCents: nullableNonNegativeCentsSchema,
  notes: z.string().trim().max(4000).nullable().optional(),
  metadata: z.unknown().optional()
});

export const updateShippingZoneRuleSchema = createShippingZoneRuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one shipping zone field must be provided." }
);

const calculationInputBaseSchema = z.object({
  costProfileId: z.string().trim().min(1),
  name: z.string().trim().max(160).nullable().optional(),
  sku: z.string().trim().max(160).nullable().optional(),
  quantity: z.number().int().positive(),
  lengthIn: z.number().positive(),
  depthIn: z.number().positive(),
  thicknessIn: z.number().positive().nullable().optional(),
  weightLb: z.number().positive().nullable().optional(),
  materialCode: z.string().trim().min(1).max(80),
  edgeBandCode: z.string().trim().max(80).nullable().optional(),
  edgeBandPattern: shelfCostEdgeBandPatternSchema,
  packagingCode: z.string().trim().max(80).nullable().optional(),
  shippingCode: z.string().trim().max(80).nullable().optional(),
  amazonFeePresetId: optionalNullableIdSchema,
  shippingZoneRuleId: optionalNullableIdSchema,
  laborMinutes: z.number().min(0),
  machineMinutes: z.number().min(0),
  overheadMinutes: z.number().min(0).nullable().optional(),
  packingMinutes: z.number().min(0).nullable().optional(),
  targetMarginPct: percentSchema.nullable().optional(),
  growthMarginPct: percentSchema.nullable().optional(),
  marketplaceFeePct: percentSchema.nullable().optional(),
  returnReservePct: percentSchema.nullable().optional(),
  damageReservePct: percentSchema.nullable().optional(),
  shippingBufferPct: percentSchema.nullable().optional(),
  shippingBufferCents: nullableNonNegativeCentsSchema
});

export const calculateShelfCostSchema = calculationInputBaseSchema;
export const saveShelfCostCalculationSchema = calculationInputBaseSchema;

export const compareScenarioInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  launchStrategy: launchStrategySchema.nullable().optional(),
  amazonFeePresetId: optionalNullableIdSchema,
  shippingZoneRuleId: optionalNullableIdSchema,
  packagingCode: z.string().trim().max(80).nullable().optional(),
  shippingCode: z.string().trim().max(80).nullable().optional(),
  targetMarginPct: percentSchema.nullable().optional(),
  growthMarginPct: percentSchema.nullable().optional(),
  marketplaceFeePct: percentSchema.nullable().optional(),
  returnReservePct: percentSchema.nullable().optional(),
  damageReservePct: percentSchema.nullable().optional(),
  shippingBufferPct: percentSchema.nullable().optional(),
  shippingBufferCents: nullableNonNegativeCentsSchema
});

export const compareShelfCostScenariosSchema = z.object({
  name: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  baseSpec: calculationInputBaseSchema,
  scenarios: z.array(compareScenarioInputSchema).min(1)
});

export const saveComparisonSetSchema = z.object({
  name: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(4000).nullable().optional(),
  baseSpec: calculationInputBaseSchema,
  scenarios: z.array(compareScenarioInputSchema).min(1)
});

export const createLaunchTemplateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  status: costProfileStatusSchema.optional(),
  defaultAmazonFeePresetId: optionalNullableIdSchema,
  defaultShippingZoneRuleId: optionalNullableIdSchema,
  defaultPackagingRuleId: optionalNullableIdSchema,
  defaultShippingRuleId: optionalNullableIdSchema,
  launchStrategy: launchStrategySchema,
  notes: z.string().trim().max(4000).nullable().optional(),
  assumptionsSnapshot: z.unknown().nullable().optional()
});

export const updateLaunchTemplateSchema = createLaunchTemplateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one launch template field must be provided." }
);

export const listShelfCostCalculationsQuerySchema = z.object({
  costProfileId: z.string().trim().min(1).optional()
});

export const listAmazonFeePresetsQuerySchema = z.object({
  costProfileId: z.string().trim().min(1).optional()
});

export const listShippingZoneRulesQuerySchema = z.object({
  costProfileId: z.string().trim().min(1).optional()
});

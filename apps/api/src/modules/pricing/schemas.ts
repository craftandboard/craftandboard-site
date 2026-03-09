import { z } from "zod";
import { COSTING_CURRENCIES, COSTING_EDGE_BAND_PATTERNS } from "../costing/contracts.js";
import { PRICING_ROUNDING_MODES, PRICING_SOURCE_TYPES } from "./contracts.js";

const materialTypeSchema = z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"]);

export const createShelfProductSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  materialType: materialTypeSchema,
  defaultThicknessIn: z.number().positive(),
  defaultEdgeBandPattern: z.literal("ALL_FOUR"),
  packagingProfileId: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional()
});

export const updateShelfProductSchema = createShelfProductSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one shelf product field must be updated."
);

export const createProductionAssumptionProfileSchema = z.object({
  name: z.string().trim().min(1),
  isDefault: z.boolean().optional(),
  cncLoadMinutesPerRun: z.number().min(0),
  cncUnloadMinutesPerRun: z.number().min(0),
  cncRunMinutesPerUnit: z.number().min(0),
  edgebanderSetupMinutesPerRun: z.number().min(0),
  edgebanderRunMinutesPerLinearFt: z.number().min(0),
  handlingMinutesPerUnit: z.number().min(0),
  packagingMinutesPerUnit: z.number().min(0),
  qcMinutesPerUnit: z.number().min(0).optional(),
  notes: z.string().trim().max(500).optional()
});

export const updateProductionAssumptionProfileSchema = createProductionAssumptionProfileSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one production assumption field must be updated."
);

export const createPackagingProfileSchema = z.object({
  name: z.string().trim().min(1),
  boxCostCentsPerUnit: z.number().int().min(0),
  bubbleWrapCostCentsPerUnit: z.number().int().min(0),
  shrinkWrapCostCentsPerUnit: z.number().int().min(0),
  tapeCostCentsPerUnit: z.number().int().min(0),
  labelCostCentsPerUnit: z.number().int().min(0),
  insertFlyerCostCentsPerUnit: z.number().int().min(0),
  otherPackagingCostCentsPerUnit: z.number().int().min(0),
  notes: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional()
});

export const updatePackagingProfileSchema = createPackagingProfileSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one packaging profile field must be updated."
);

export const createPricingPolicySchema = z.object({
  name: z.string().trim().min(1),
  isDefault: z.boolean().optional(),
  manufacturingMarkupPercent: z.number().min(0),
  minimumChargeCentsPerUnit: z.number().int().min(0).optional(),
  minimumRunChargeCents: z.number().int().min(0).optional(),
  roundingMode: z.enum(PRICING_ROUNDING_MODES).optional(),
  roundToCents: z.number().int().positive().optional(),
  notes: z.string().trim().max(500).optional()
});

export const updatePricingPolicySchema = createPricingPolicySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one pricing policy field must be updated."
);

const calculatePricingBaseSchema = z.object({
  shelfProductId: z.string().trim().min(1).optional(),
  costProfileId: z.string().trim().min(1),
  productionAssumptionProfileId: z.string().trim().min(1),
  packagingProfileId: z.string().trim().min(1).optional(),
  pricingPolicyId: z.string().trim().min(1),
  lengthIn: z.number().positive(),
  depthIn: z.number().positive(),
  thicknessIn: z.number().positive().optional(),
  quantity: z.number().int().positive(),
  materialType: materialTypeSchema.optional(),
  edgeBandPattern: z.enum(COSTING_EDGE_BAND_PATTERNS).optional(),
  requiresPackaging: z.boolean(),
  includeScenarioSave: z.boolean().optional(),
  scenarioName: z.string().trim().min(1).optional()
});

export const calculatePricingSchema = calculatePricingBaseSchema.superRefine((value, ctx) => {
  if (!value.shelfProductId) {
    if (!value.materialType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "materialType is required when shelfProductId is not provided.", path: ["materialType"] });
    if (!value.edgeBandPattern) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "edgeBandPattern is required when shelfProductId is not provided.", path: ["edgeBandPattern"] });
  }
});

export const createPricingScenarioSchema = z.object({
  shelfProductId: z.string().trim().min(1).optional(),
  costProfileId: z.string().trim().min(1),
  productionAssumptionProfileId: z.string().trim().min(1),
  packagingProfileId: z.string().trim().min(1).optional(),
  pricingPolicyId: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  sourceType: z.enum(PRICING_SOURCE_TYPES),
  sourceId: z.string().trim().min(1).optional(),
  input: calculatePricingBaseSchema.omit({ includeScenarioSave: true, scenarioName: true })
});

export const createPricingDefaultsSchema = z.object({
  currency: z.enum(COSTING_CURRENCIES)
});

import { z } from "zod";
import {
  COSTING_CURRENCIES,
  COSTING_EDGE_BAND_PATTERNS,
  COST_RATE_KEYS,
  COST_SCENARIO_SOURCE_TYPES
} from "./contracts.js";

export const materialCodeSchema = z.enum([
  "WHITE_MELAMINE",
  "MAPLE_MELAMINE",
  "BIRCH_18",
  "WALNUT_18",
  "MAPLE_18",
  "MDF_18"
]);

export const createCostProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  isDefault: z.boolean().optional(),
  currency: z.enum(COSTING_CURRENCIES).default("USD"),
  notes: z.string().trim().max(500).optional()
});

export const updateCostProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  isDefault: z.boolean().optional(),
  currency: z.enum(COSTING_CURRENCIES).optional(),
  notes: z.string().trim().max(500).optional()
});

export const upsertCostRatesSchema = z.object({
  rates: z.array(
    z.object({
      key: z.enum(COST_RATE_KEYS),
      valueDecimal: z.number().finite().nonnegative(),
      unit: z.string().trim().min(1).max(60),
      notes: z.string().trim().max(500).optional(),
      effectiveFrom: z.string().datetime().optional(),
      effectiveTo: z.string().datetime().optional()
    })
  ).min(1)
});

export const calculateCostSchema = z.object({
  costProfileId: z.string().trim().min(1),
  lengthIn: z.number().positive(),
  depthIn: z.number().positive(),
  thicknessIn: z.number().positive().optional(),
  quantity: z.number().int().positive(),
  materialType: materialCodeSchema,
  edgeBandPattern: z.enum(COSTING_EDGE_BAND_PATTERNS),
  requiresPackaging: z.boolean().default(true),
  shippingClass: z.string().trim().min(1).optional()
});

export const createCostScenarioSchema = z.object({
  name: z.string().trim().max(120).optional(),
  sourceType: z.enum(COST_SCENARIO_SOURCE_TYPES).default("MANUAL"),
  sourceId: z.string().trim().min(1).optional(),
  input: calculateCostSchema
});

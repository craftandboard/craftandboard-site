import { z } from "zod";
import { MANUFACTURING_BATCH_TYPES, MANUFACTURING_PART_STATUSES } from "./contracts.js";

const materialTypeSchema = z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"]);

export const expandManufacturingPacketSchema = z.object({
  notes: z.string().trim().max(500).optional()
});

export const createManufacturingBatchSchema = z.object({
  batchType: z.enum(MANUFACTURING_BATCH_TYPES),
  partIds: z.array(z.string().trim().min(1)).min(1),
  materialType: materialTypeSchema.optional(),
  thicknessIn: z.number().positive().optional(),
  notes: z.string().trim().max(500).optional()
});

export const addPartsToManufacturingBatchSchema = z.object({
  partIds: z.array(z.string().trim().min(1)).min(1)
});

export const createLabelTemplateSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  version: z.number().int().positive(),
  isDefault: z.boolean().optional(),
  templateJson: z.record(z.string(), z.any())
});

export const updateLabelTemplateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isDefault: z.boolean().optional(),
  templateJson: z.record(z.string(), z.any()).optional()
});

export const listManufacturingPartsQuerySchema = z.object({
  packetId: z.string().trim().min(1).optional(),
  batchId: z.string().trim().min(1).optional(),
  status: z.enum(MANUFACTURING_PART_STATUSES).optional()
});

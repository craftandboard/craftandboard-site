import { z } from "zod";
import { SALES_ORDER_SOURCE_TYPES } from "./contracts.js";

const materialTypeSchema = z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"]);
const edgeBandPatternSchema = z.enum(["ALL_FOUR"]);

export const createSalesOrderSchema = z.object({
  sourceType: z.enum(SALES_ORDER_SOURCE_TYPES),
  sourceOrderId: z.string().trim().min(1).optional(),
  sourceStatus: z.string().trim().min(1).optional(),
  customerName: z.string().trim().min(1).optional(),
  customerEmail: z.string().trim().email().optional(),
  shipToName: z.string().trim().min(1).optional(),
  shipToAddressJson: z.record(z.string(), z.any()).optional(),
  orderedAt: z.string().datetime().optional(),
  currency: z.string().trim().min(1).default("USD"),
  notes: z.string().trim().max(500).optional()
});

export const addSalesOrderItemsSchema = z.object({
  items: z.array(
    z.object({
      sourceLineId: z.string().trim().min(1).optional(),
      shelfProductId: z.string().trim().min(1).optional(),
      sku: z.string().trim().min(1).optional(),
      title: z.string().trim().min(1),
      quantity: z.number().int(),
      lengthIn: z.number().positive().optional(),
      depthIn: z.number().positive().optional(),
      thicknessIn: z.number().positive().optional(),
      materialType: materialTypeSchema.optional(),
      edgeBandPattern: edgeBandPatternSchema.optional(),
      requiresPackaging: z.boolean().optional(),
      packagingProfileId: z.string().trim().min(1).optional(),
      customizationJson: z.record(z.string(), z.any()).optional(),
      notes: z.string().trim().max(500).optional()
    })
  ).min(1)
});

export const convertShelfJobsToPacketSchema = z.object({
  shelfJobIds: z.array(z.string().trim().min(1)).min(1)
});


import { z } from "zod";

const adjustmentValue = z.union([z.string(), z.number()]).nullish();

export const amazonCustomizationSchema = z.object({
  lengthInches: adjustmentValue,
  lengthFraction: adjustmentValue,
  lengthAdjustment: adjustmentValue,
  depthInches: adjustmentValue,
  depthFraction: adjustmentValue,
  depthAdjustment: adjustmentValue,
  edgebanding: z.string().nullish(),
  contactInfo: z.string().nullish(),
  notes: z.string().nullish()
});

export const amazonFixtureSchema = z.object({
  amazonOrderId: z.string().min(1),
  amazonOrderItemId: z.string().min(1),
  asin: z.string().nullish(),
  quantity: z.coerce.number().int().positive(),
  buyerName: z.string().min(1),
  shipToName: z.string().nullish(),
  purchaseDate: z.string().nullish(),
  shipByDate: z.string().min(1),
  productTitle: z.string().min(1),
  sku: z.string().min(1),
  material: z.string().nullish(),
  customizations: amazonCustomizationSchema
});

export type AmazonFixtureSchema = z.infer<typeof amazonFixtureSchema>;

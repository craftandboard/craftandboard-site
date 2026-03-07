import { z } from "zod";

export const rawFixtureLineItemSchema = z.object({
  externalOrderItemId: z.string().min(1),
  sku: z.string().min(1),
  title: z.string().min(1),
  material: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  widthWhole: z.union([z.number(), z.string()]).nullish(),
  widthFraction: z.union([z.number(), z.string()]).nullish(),
  widthIn: z.union([z.number(), z.string()]).nullish(),
  depthWhole: z.union([z.number(), z.string()]).nullish(),
  depthFraction: z.union([z.number(), z.string()]).nullish(),
  depthIn: z.union([z.number(), z.string()]).nullish(),
  edgeBandPattern: z.string().nullish(),
  notes: z.string().nullish()
});

export const rawFixtureOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  amazonOrderId: z.string().min(1),
  orderDate: z.string().min(1),
  shipByDate: z.string().min(1),
  customerName: z.string().min(1),
  lineItems: z.array(rawFixtureLineItemSchema).min(1)
});

export type RawFixtureOrderSchema = z.infer<typeof rawFixtureOrderSchema>;

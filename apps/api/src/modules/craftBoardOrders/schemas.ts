import { z } from "zod";

export const craftBoardOrderStatusSchema = z.enum([
  "RELEASED",
  "PREP_IN_PROGRESS",
  "READY_FOR_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_FULFILL",
  "FULFILLED",
  "CLOSED",
  "CANCELLED"
]);

export const craftBoardOrderIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const craftBoardOrderCreateParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const listCraftBoardOrdersQuerySchema = z.object({
  status: craftBoardOrderStatusSchema.optional(),
  q: z.string().trim().max(160).optional()
});

export const createCraftBoardOrderSchema = z.object({
  internalReleaseNotes: z.string().trim().max(4000).nullable().optional(),
  productionPrepNotes: z.string().trim().max(4000).nullable().optional(),
  fulfillmentNotes: z.string().trim().max(4000).nullable().optional(),
  requestedShipDate: z.string().datetime().nullable().optional(),
  targetCompletionDate: z.string().datetime().nullable().optional(),
  overrideEligibility: z.boolean().optional()
});

const patchBaseSchema = z.object({
  status: craftBoardOrderStatusSchema.optional(),
  internalReleaseNotes: z.string().trim().max(4000).nullable().optional(),
  productionPrepNotes: z.string().trim().max(4000).nullable().optional(),
  fulfillmentNotes: z.string().trim().max(4000).nullable().optional(),
  requestedShipDate: z.string().datetime().nullable().optional(),
  targetCompletionDate: z.string().datetime().nullable().optional()
});

export const updateCraftBoardOrderSchema = patchBaseSchema.superRefine((value, context) => {
  if (!Object.values(value).some((entry) => entry !== undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one order field must be provided."
    });
  }
});

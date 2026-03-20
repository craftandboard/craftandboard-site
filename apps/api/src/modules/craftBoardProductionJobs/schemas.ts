import { z } from "zod";

export const craftBoardProductionJobStatusSchema = z.enum([
  "RELEASED",
  "PREP_IN_PROGRESS",
  "READY_FOR_BUILD",
  "IN_BUILD",
  "BUILD_COMPLETE",
  "READY_FOR_FULFILLMENT",
  "FULFILLED",
  "CANCELLED"
]);

export const craftBoardProductionJobStageSchema = z.enum([
  "PREP",
  "READY_TO_BUILD",
  "IN_BUILD",
  "BUILD_COMPLETE",
  "READY_TO_FULFILL",
  "FULFILLED",
  "CANCELLED"
]);

export const craftBoardProductionJobIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const craftBoardProductionJobCreateParamsSchema = z.object({
  orderId: z.string().trim().min(1)
});

export const listCraftBoardProductionJobsQuerySchema = z.object({
  status: craftBoardProductionJobStatusSchema.optional(),
  stage: craftBoardProductionJobStageSchema.optional(),
  includeFulfilled: z.coerce.boolean().optional(),
  includeCancelled: z.coerce.boolean().optional(),
  q: z.string().trim().max(160).optional()
});

export const createCraftBoardProductionJobSchema = z.object({
  productionPrepNotes: z.string().trim().max(4000).nullable().optional(),
  shopNotes: z.string().trim().max(4000).nullable().optional(),
  fulfillmentNotes: z.string().trim().max(4000).nullable().optional(),
  cutPrepNotes: z.string().trim().max(4000).nullable().optional(),
  materialPrepNotes: z.string().trim().max(4000).nullable().optional(),
  packagingPrepNotes: z.string().trim().max(4000).nullable().optional(),
  targetCompletionDate: z.string().datetime().nullable().optional(),
  requestedShipDate: z.string().datetime().nullable().optional()
});

const patchBaseSchema = z.object({
  status: craftBoardProductionJobStatusSchema.optional(),
  stage: craftBoardProductionJobStageSchema.optional(),
  targetCompletionDate: z.string().datetime().nullable().optional(),
  requestedShipDate: z.string().datetime().nullable().optional(),
  productionPrepNotes: z.string().trim().max(4000).nullable().optional(),
  shopNotes: z.string().trim().max(4000).nullable().optional(),
  fulfillmentNotes: z.string().trim().max(4000).nullable().optional(),
  cutPrepNotes: z.string().trim().max(4000).nullable().optional(),
  materialPrepNotes: z.string().trim().max(4000).nullable().optional(),
  packagingPrepNotes: z.string().trim().max(4000).nullable().optional(),
  checklistDimensionsConfirmed: z.boolean().optional(),
  checklistMaterialConfirmed: z.boolean().optional(),
  checklistMountingConfirmed: z.boolean().optional(),
  checklistDepositVerified: z.boolean().optional(),
  checklistScopeConfirmed: z.boolean().optional(),
  checklistReadyForBuild: z.boolean().optional()
});

export const updateCraftBoardProductionJobSchema = patchBaseSchema.superRefine((value, context) => {
  if (!Object.values(value).some((entry) => entry !== undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one production job field must be provided."
    });
  }
});

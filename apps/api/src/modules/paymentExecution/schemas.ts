import { z } from "zod";

const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());

export const proposalIdParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const executionIdParamsSchema = z.object({
  executionId: z.string().trim().min(1)
});

export const eventIdParamsSchema = z.object({
  eventId: z.string().trim().min(1)
});

export const providerParamsSchema = z.object({
  provider: z.string().trim().min(1)
});

export const createExecutionSchema = z
  .object({
    provider: z.string().trim().min(1).max(64),
    mode: z.string().trim().min(1).max(64),
    depositRequestId: z.string().trim().min(1).nullable().optional(),
    paymentId: z.string().trim().min(1).nullable().optional(),
    amountCents: z.number().int().positive().optional(),
    currency: currencySchema.optional(),
    externalReference: z.string().trim().max(160).nullable().optional(),
    metadata: z.unknown().optional()
  })
  .refine((value) => value.depositRequestId || value.paymentId, {
    message: "A depositRequestId or paymentId is required."
  });

export const refreshExecutionSchema = z.object({
  force: z.boolean().optional()
});

import { z } from "zod";

const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());
const metadataSchema = z.unknown().optional();
const dateSchema = z.coerce.date();

export const proposalIdParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const depositRequestIdParamsSchema = z.object({
  depositRequestId: z.string().trim().min(1)
});

export const paymentIdParamsSchema = z.object({
  paymentId: z.string().trim().min(1)
});

export const depositRequestCreateSchema = z.object({
  kind: z.string().trim().min(1).max(64).optional(),
  status: z.string().trim().min(1).max(64).optional(),
  amountCents: z.number().int().positive(),
  currency: currencySchema.optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  requestedAt: dateSchema.nullable().optional(),
  dueAt: dateSchema.nullable().optional(),
  externalReference: z.string().trim().max(160).nullable().optional(),
  metadata: metadataSchema
});

export const depositRequestUpdateSchema = z
  .object({
    status: z.string().trim().min(1).max(64).optional(),
    amountCents: z.number().int().positive().optional(),
    currency: currencySchema.optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    requestedAt: dateSchema.nullable().optional(),
    dueAt: dateSchema.nullable().optional(),
    externalReference: z.string().trim().max(160).nullable().optional(),
    metadata: metadataSchema
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one deposit request field must be provided."
  });

export const paymentCreateSchema = z.object({
  depositRequestId: z.string().trim().min(1).nullable().optional(),
  status: z.string().trim().min(1).max(64).optional(),
  method: z.string().trim().min(1).max(64).optional(),
  amountCents: z.number().int().positive(),
  currency: currencySchema.optional(),
  direction: z.string().trim().min(1).max(32).optional(),
  receivedAt: dateSchema.nullable().optional(),
  externalReference: z.string().trim().max(160).nullable().optional(),
  provider: z.string().trim().max(64).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  metadata: metadataSchema
});

export const paymentUpdateSchema = z
  .object({
    status: z.string().trim().min(1).max(64).optional(),
    receivedAt: dateSchema.nullable().optional(),
    externalReference: z.string().trim().max(160).nullable().optional(),
    provider: z.string().trim().max(64).nullable().optional(),
    note: z.string().trim().max(1000).nullable().optional(),
    metadata: metadataSchema
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one payment field must be provided."
  });

import { z } from "zod";

export const proposalIdParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const intakeIdParamsSchema = z.object({
  intakeId: z.string().trim().min(1)
});

export const providerParamsSchema = z.object({
  provider: z.string().trim().min(1)
});

export const createIntakeSchema = z.object({
  source: z
    .enum(["PUBLIC_TOKEN", "PROVIDER_CALLBACK", "EXTERNAL_MANUAL_ENTRY"])
    .optional()
    .default("PUBLIC_TOKEN"),
  tokenTtlHours: z.number().int().positive().max(24 * 30).optional(),
  provider: z.string().trim().min(1).max(64).optional(),
  providerReference: z.string().trim().min(1).max(160).optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  metadata: z.unknown().optional(),
  confirmed: z.boolean().optional(),
  signerName: z.string().trim().min(1).max(160).optional(),
  signerEmail: z.string().trim().email().max(320).nullable().optional()
});

export const revokeIntakeSchema = z.object({
  note: z.string().trim().max(1000).nullable().optional()
});

export const publicValidateTokenSchema = z.object({
  token: z.string().trim().min(16).max(512)
});

export const publicSubmitSchema = z.object({
  token: z.string().trim().min(16).max(512),
  confirmed: z.boolean(),
  signerName: z.string().trim().min(1).max(160),
  signerEmail: z.string().trim().email().max(320).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  metadata: z.unknown().optional()
});

export const providerAcceptanceSignalSchema = z
  .object({
    intakeId: z.string().trim().min(1).optional(),
    proposalLookup: z.string().trim().min(1).optional(),
    providerReference: z.string().trim().min(1).max(160).optional(),
    confirmed: z.boolean().optional(),
    signerName: z.string().trim().min(1).max(160).optional(),
    signerEmail: z.string().trim().email().max(320).nullable().optional(),
    note: z.string().trim().max(1000).nullable().optional(),
    metadata: z.unknown().optional()
  })
  .refine((value) => Boolean(value.intakeId || value.proposalLookup), {
    message: "An intakeId or proposalLookup is required."
  });

import { z } from "zod";

export const proposalIdParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const acceptanceCreateSchema = z.object({
  decisionSource: z.string().trim().min(1).max(64).optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  depositPolicy: z.enum(["NO_DEPOSIT_REQUIRED", "DEPOSIT_REQUIRED_BEFORE_CONVERSION"]).optional(),
  metadata: z.unknown().optional()
});

export const acceptanceActionSchema = z.object({
  action: z.enum(["accept", "reject", "cancel"]),
  decisionSource: z.string().trim().min(1).max(64).optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  metadata: z.unknown().optional()
});

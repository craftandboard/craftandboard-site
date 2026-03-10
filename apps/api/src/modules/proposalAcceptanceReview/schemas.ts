import { z } from "zod";

export const proposalIdParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const reviewTokenSchema = z.object({
  token: z.string().trim().min(16).max(512)
});

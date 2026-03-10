import { z } from "zod";

export const pilotFeedbackAreaSchema = z.enum([
  "LEADS",
  "PROPOSALS",
  "PUBLIC_ACCEPTANCE",
  "PROJECTS",
  "GENERAL"
]);

export const pilotFeedbackSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "BLOCKER"]);
export const pilotFeedbackStatusSchema = z.enum(["NEW", "REVIEWED", "RESOLVED"]);

export const createPilotFeedbackSchema = z.object({
  area: pilotFeedbackAreaSchema,
  severity: pilotFeedbackSeveritySchema,
  pagePath: z.string().trim().max(300).nullable().optional(),
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(4000),
  reproductionNotes: z.string().trim().max(4000).nullable().optional(),
  screenshotUrl: z.string().trim().url().max(2000).nullable().optional(),
  metadata: z.unknown().optional()
});

export const listPilotFeedbackQuerySchema = z.object({
  area: pilotFeedbackAreaSchema.optional(),
  severity: pilotFeedbackSeveritySchema.optional(),
  status: pilotFeedbackStatusSchema.optional()
});

export const feedbackIdParamsSchema = z.object({
  feedbackId: z.string().trim().min(1)
});

export const updatePilotFeedbackSchema = z
  .object({
    status: pilotFeedbackStatusSchema.optional()
  })
  .refine((value) => value.status !== undefined, {
    message: "At least one pilot feedback field must be provided."
  });

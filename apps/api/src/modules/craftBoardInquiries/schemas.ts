import { z } from "zod";

export const craftBoardInquiryStatusSchema = z.enum([
  "NEW",
  "REVIEWED",
  "QUOTE_IN_PROGRESS",
  "QUOTED",
  "CLOSED",
  "LOST"
]);

const trimmedOptional = z.string().trim().min(1).max(240).nullable().optional();

export const createCraftBoardInquirySchema = z.object({
  source: z.string().trim().min(1).max(80).default("storefront"),
  sourcePath: z.string().trim().min(1).max(240).nullable().optional(),
  productFamily: z.string().trim().min(1).max(80),
  productSlug: z.string().trim().min(1).max(160).nullable().optional(),
  productName: z.string().trim().min(1).max(160),
  customerName: z.string().trim().min(1).max(160),
  customerEmail: z.string().trim().email().max(240),
  customerPhone: z.string().trim().max(40).nullable().optional(),
  widthValue: z.number().positive(),
  widthUnit: z.string().trim().min(1).max(16).default("IN"),
  depthValue: z.number().positive(),
  depthUnit: z.string().trim().min(1).max(16).default("IN"),
  thicknessValue: z.number().positive(),
  thicknessUnit: z.string().trim().min(1).max(16).default("IN"),
  quantity: z.number().int().min(1).max(999),
  materialCode: trimmedOptional,
  materialLabel: z.string().trim().min(1).max(160),
  mountingCode: trimmedOptional,
  mountingLabel: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(4000).nullable().optional(),
  configurationJson: z.record(z.string(), z.unknown())
});

export const listCraftBoardInquiriesQuerySchema = z.object({
  status: craftBoardInquiryStatusSchema.optional(),
  q: z.string().trim().max(160).optional(),
  productFamily: z.string().trim().max(80).optional(),
  assignedToUserId: z.string().trim().max(80).optional(),
  estimateState: z.enum(["has-estimate", "needs-estimate"]).optional()
});

export const craftBoardInquiryIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

const updateCraftBoardInquiryBaseSchema = z.object({
  status: craftBoardInquiryStatusSchema.optional(),
  assignedToUserId: z.string().trim().min(1).max(80).nullable().optional(),
  internalNotes: z.string().trim().max(4000).nullable().optional(),
  followUpNotes: z.string().trim().max(4000).nullable().optional(),
  reviewedWidthValue: z.number().positive().nullable().optional(),
  reviewedDepthValue: z.number().positive().nullable().optional(),
  reviewedThicknessValue: z.number().positive().nullable().optional(),
  reviewedQuantity: z.number().int().min(1).max(999).nullable().optional(),
  reviewedMaterialCode: z.string().trim().max(80).nullable().optional(),
  reviewedMaterialLabel: z.string().trim().max(160).nullable().optional(),
  reviewedMountingCode: z.string().trim().max(80).nullable().optional(),
  reviewedMountingLabel: z.string().trim().max(160).nullable().optional(),
  estimateBaseAmountCents: z.number().int().min(0).nullable().optional(),
  estimateLowAmountCents: z.number().int().min(0).nullable().optional(),
  estimateHighAmountCents: z.number().int().min(0).nullable().optional(),
  estimateCurrencyCode: z.string().trim().max(8).nullable().optional(),
  estimateLeadTimeText: z.string().trim().max(160).nullable().optional(),
  estimateSummaryJson: z.record(z.string(), z.unknown()).nullable().optional(),
  quotePreparedBy: z.string().trim().max(160).nullable().optional(),
  quoteReferenceCode: z.string().trim().max(40).nullable().optional()
});

export const updateCraftBoardInquirySchema = updateCraftBoardInquiryBaseSchema.superRefine(
  (value, context) => {
    if (!Object.values(value).some((entry) => entry !== undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one inquiry field must be provided."
      });
    }

    if (
      value.estimateLowAmountCents !== undefined &&
      value.estimateHighAmountCents !== undefined &&
      value.estimateLowAmountCents !== null &&
      value.estimateHighAmountCents !== null &&
      value.estimateLowAmountCents > value.estimateHighAmountCents
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Estimate low amount cannot exceed estimate high amount."
      });
    }
  }
);

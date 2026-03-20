import { z } from "zod";

export const craftBoardProposalStatusSchema = z.enum([
  "DRAFT",
  "READY",
  "SHARED",
  "VIEWED",
  "APPROVED",
  "DECLINED",
  "EXPIRED",
  "ARCHIVED"
]);

const trimmedOptional = z.string().trim().min(1).max(240).nullable().optional();

export const craftBoardProposalIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const craftBoardProposalTokenParamsSchema = z.object({
  publicToken: z.string().trim().min(1)
});

export const craftBoardProposalCreateParamsSchema = z.object({
  inquiryId: z.string().trim().min(1)
});

export const craftBoardProposalLineItemInputSchema = z.object({
  id: z.string().trim().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.number().positive(),
  unitLabel: z.string().trim().max(40).nullable().optional(),
  unitAmountCents: z.number().int().min(0),
  itemType: z.string().trim().max(80).nullable().optional()
});

export const listCraftBoardProposalsQuerySchema = z.object({
  status: craftBoardProposalStatusSchema.optional(),
  q: z.string().trim().max(160).optional()
});

const patchBaseSchema = z.object({
  status: craftBoardProposalStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  customerNameSnapshot: z.string().trim().min(1).max(160).optional(),
  customerEmailSnapshot: z.string().trim().email().max(240).optional(),
  customerPhoneSnapshot: z.string().trim().max(40).nullable().optional(),
  productFamily: z.string().trim().min(1).max(80).optional(),
  productName: z.string().trim().min(1).max(160).optional(),
  reviewedWidthValue: z.number().positive().nullable().optional(),
  reviewedDepthValue: z.number().positive().nullable().optional(),
  reviewedThicknessValue: z.number().positive().nullable().optional(),
  reviewedQuantity: z.number().int().min(1).max(999).optional(),
  reviewedMaterialCode: z.string().trim().max(80).nullable().optional(),
  reviewedMaterialLabel: z.string().trim().max(160).nullable().optional(),
  reviewedMountingCode: z.string().trim().max(80).nullable().optional(),
  reviewedMountingLabel: z.string().trim().max(160).nullable().optional(),
  discountAmountCents: z.number().int().min(0).optional(),
  shippingAmountCents: z.number().int().min(0).optional(),
  currencyCode: z.string().trim().min(1).max(8).optional(),
  leadTimeText: z.string().trim().max(160).nullable().optional(),
  scopeSummary: z.string().trim().min(1).max(4000).optional(),
  inclusionsText: z.string().trim().max(4000).nullable().optional(),
  exclusionsText: z.string().trim().max(4000).nullable().optional(),
  notesForCustomer: z.string().trim().max(4000).nullable().optional(),
  internalNotes: z.string().trim().max(4000).nullable().optional(),
  expirationDate: z.string().datetime().nullable().optional(),
  preparedBy: z.string().trim().max(160).nullable().optional(),
  referenceCode: z.string().trim().max(80).nullable().optional(),
  lineItems: z.array(craftBoardProposalLineItemInputSchema).max(24).optional()
});

export const updateCraftBoardProposalSchema = patchBaseSchema.superRefine((value, context) => {
  if (!Object.values(value).some((entry) => entry !== undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one proposal field must be provided."
    });
  }
});

export const craftBoardProposalPublicResponseSchema = z.object({
  action: z.enum(["approve", "decline"])
});

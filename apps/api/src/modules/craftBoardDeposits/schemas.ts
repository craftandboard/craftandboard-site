import { z } from "zod";

export const craftBoardDepositRequestStatusSchema = z.enum([
  "DRAFT",
  "READY",
  "SHARED",
  "VIEWED",
  "PAYMENT_INITIATED",
  "PAID",
  "CANCELLED",
  "EXPIRED"
]);

export const craftBoardDepositTypeSchema = z.enum(["FIXED_AMOUNT", "PERCENTAGE"]);

export const craftBoardDepositIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const craftBoardDepositTokenParamsSchema = z.object({
  publicToken: z.string().trim().min(1)
});

export const craftBoardDepositCreateParamsSchema = z.object({
  proposalId: z.string().trim().min(1)
});

export const listCraftBoardDepositsQuerySchema = z.object({
  status: craftBoardDepositRequestStatusSchema.optional(),
  q: z.string().trim().max(160).optional()
});

export const createCraftBoardDepositRequestSchema = z
  .object({
    depositType: craftBoardDepositTypeSchema.default("PERCENTAGE"),
    depositPercentBasisPoints: z.number().int().min(1).max(10000).nullable().optional(),
    depositAmountCents: z.number().int().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(200).nullable().optional(),
    descriptionText: z.string().trim().max(4000).nullable().optional(),
    customerInstructionsText: z.string().trim().max(4000).nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    internalNotes: z.string().trim().max(4000).nullable().optional()
  })
  .superRefine((value, context) => {
    if (value.depositType === "PERCENTAGE" && (value.depositPercentBasisPoints ?? null) === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Deposit percentage is required for percentage deposits."
      });
    }

    if (value.depositType === "FIXED_AMOUNT" && (value.depositAmountCents ?? null) === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Deposit amount is required for fixed deposits."
      });
    }
  });

const patchBaseSchema = z.object({
  status: craftBoardDepositRequestStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  customerNameSnapshot: z.string().trim().min(1).max(160).optional(),
  customerEmailSnapshot: z.string().trim().email().max(240).optional(),
  customerPhoneSnapshot: z.string().trim().max(40).nullable().optional(),
  currencyCode: z.string().trim().min(1).max(8).optional(),
  depositType: craftBoardDepositTypeSchema.optional(),
  depositPercentBasisPoints: z.number().int().min(1).max(10000).nullable().optional(),
  depositAmountCents: z.number().int().min(1).nullable().optional(),
  descriptionText: z.string().trim().max(4000).nullable().optional(),
  customerInstructionsText: z.string().trim().max(4000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  internalNotes: z.string().trim().max(4000).nullable().optional(),
  paymentReceiptReference: z.string().trim().max(160).nullable().optional(),
  paymentProvider: z.string().trim().max(80).nullable().optional(),
  paymentProviderReference: z.string().trim().max(160).nullable().optional(),
  paymentIntentId: z.string().trim().max(160).nullable().optional(),
  checkoutSessionId: z.string().trim().max(160).nullable().optional()
});

export const updateCraftBoardDepositRequestSchema = patchBaseSchema.superRefine((value, context) => {
  if (!Object.values(value).some((entry) => entry !== undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one deposit field must be provided."
    });
  }
});

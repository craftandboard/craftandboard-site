import { z } from "zod";

const materialCodes = [
  "WHITE_OAK",
  "WALNUT",
  "NATURAL_MAPLE",
  "PAINTED_MAPLE"
] as const;

const mountingCodes = [
  "STANDARD_CONCEALED",
  "HEAVY_DUTY_CONCEALED",
  "CONSULT_REQUIRED"
] as const;

const paymentModes = [
  "DEPOSIT_REQUEST",
  "FULL_PAYMENT_LATER",
  "PAY_NOW_PLACEHOLDER"
] as const;

const orderIntents = [
  "PURCHASE_STANDARD",
  "REQUEST_REVIEW"
] as const;

const changeRequestTypes = [
  "UPDATE_DIMENSIONS",
  "UPDATE_MATERIAL_OR_FINISH",
  "UPDATE_MOUNTING",
  "UPDATE_SHIPPING_ADDRESS",
  "HOLD_ORDER",
  "CANCEL_REQUEST",
  "GENERAL_CHANGE_REQUEST"
] as const;

const orderIssueTypes = [
  "SHIPPING_DAMAGE",
  "MISSING_PARTS_OR_HARDWARE",
  "WRONG_ITEM_RECEIVED",
  "FINISH_OR_QUALITY_ISSUE",
  "DELIVERY_PROBLEM",
  "RETURN_REQUEST",
  "GENERAL_ORDER_ISSUE"
] as const;

const shippingModes = [
  "PARCEL",
  "OVERSIZE_PARCEL",
  "LTL_FREIGHT",
  "LOCAL_DELIVERY",
  "PICKUP",
  "REVIEW_REQUIRED"
] as const;

const shippingQuoteSources = [
  "LIVE_PROVIDER",
  "ESTIMATE_RULES",
  "MANUAL_REVIEW"
] as const;

const taxQuoteSources = [
  "LIVE_PROVIDER",
  "ESTIMATE_RULES",
  "NOT_APPLICABLE",
  "MANUAL_REVIEW"
] as const;

const packagingProfiles = [
  "long_shelf_box",
  "mantel_box",
  "long_oversize_box",
  "mantel_crate",
  "freight_pallet"
] as const;

export const floatingShelfConfigurationSchema = z.object({
  productFamily: z.literal("floating-shelves"),
  productSlug: z.literal("classic-floating-shelf"),
  width: z.number().positive().max(144),
  widthUnit: z.literal("IN"),
  depth: z.union([z.literal(8), z.literal(10), z.literal(12)]),
  depthUnit: z.literal("IN"),
  thickness: z.union([z.literal(1.5), z.literal(2), z.literal(2.5)]),
  thicknessUnit: z.literal("IN"),
  quantity: z.number().int().min(1).max(12),
  materialCode: z.enum(materialCodes),
  materialLabel: z.string().trim().min(1).max(120),
  mountingCode: z.enum(mountingCodes),
  mountingLabel: z.string().trim().min(1).max(160),
  finishCode: z.string().trim().max(120).nullable().optional(),
  finishLabel: z.string().trim().max(160).nullable().optional(),
  edgeProfileCode: z.string().trim().max(120).nullable().optional(),
  edgeProfileLabel: z.string().trim().max(160).nullable().optional(),
  colorCode: z.string().trim().max(120).nullable().optional(),
  customNotes: z.string().trim().max(2000).nullable().optional()
});

export const floatingShelfPricePreviewSchema = z.object({
  configuration: floatingShelfConfigurationSchema
});

export const floatingMantelConfigurationSchema = z.object({
  productFamily: z.literal("floating-mantels"),
  productSlug: z.literal("classic-floating-mantel"),
  length: z.number().positive().max(180),
  lengthUnit: z.literal("IN"),
  depth: z.union([z.literal(8), z.literal(10), z.literal(12)]),
  depthUnit: z.literal("IN"),
  height: z.union([z.literal(4), z.literal(5), z.literal(6)]),
  heightUnit: z.literal("IN"),
  quantity: z.number().int().min(1).max(6),
  materialCode: z.enum(materialCodes),
  materialLabel: z.string().trim().min(1).max(120),
  mountingCode: z.enum(mountingCodes),
  mountingLabel: z.string().trim().min(1).max(160),
  finishCode: z.string().trim().max(120).nullable().optional(),
  finishLabel: z.string().trim().max(160).nullable().optional(),
  hollowVsSolidCode: z.string().trim().max(120).nullable().optional(),
  hollowVsSolidLabel: z.string().trim().max(160).nullable().optional(),
  edgeProfileCode: z.string().trim().max(120).nullable().optional(),
  edgeProfileLabel: z.string().trim().max(160).nullable().optional(),
  customNotes: z.string().trim().max(2000).nullable().optional()
});

export const configurableProductPricePreviewSchema = z.object({
  configuration: z.discriminatedUnion("productSlug", [
    floatingShelfConfigurationSchema,
    floatingMantelConfigurationSchema
  ])
});

export const floatingShelfPricingResultSchema = z.object({
  productFamily: z.literal("floating-shelves"),
  productSlug: z.literal("classic-floating-shelf"),
  currencyCode: z.literal("USD"),
  priceState: z.enum(["instant", "estimate", "consult"]),
  instantPriceEligible: z.boolean(),
  reviewRequired: z.boolean(),
  consultRequired: z.boolean(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  totalPriceCents: z.number().int().min(0),
  quantityTotalCents: z.number().int().min(0),
  estimatedSubtotalCents: z.number().int().min(0),
  depositEligible: z.boolean(),
  shippingProfileHint: z.enum(["parcel-ready", "oversize-home-delivery", "review-required"]),
  leadTimeText: z.string().trim().min(1).max(200),
  pricingBasisVersion: z.string().trim().min(1).max(120),
  warnings: z.array(z.string().trim().min(1).max(240)),
  customerMessage: z.string().trim().min(1).max(400),
  components: z.array(
    z.object({
      code: z.enum(["material", "fabrication", "mounting", "packaging", "margin"]),
      label: z.string().trim().min(1).max(120),
      amountCents: z.number().int().min(0)
    })
  )
});

export const floatingMantelPricingResultSchema = z.object({
  productFamily: z.literal("floating-mantels"),
  productSlug: z.literal("classic-floating-mantel"),
  currencyCode: z.literal("USD"),
  priceState: z.enum(["instant", "estimate", "consult"]),
  instantPriceEligible: z.boolean(),
  reviewRequired: z.boolean(),
  consultRequired: z.boolean(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  totalPriceCents: z.number().int().min(0),
  quantityTotalCents: z.number().int().min(0),
  estimatedSubtotalCents: z.number().int().min(0),
  depositEligible: z.boolean(),
  shippingProfileHint: z.enum(["parcel-ready", "oversize-home-delivery", "review-required"]),
  leadTimeText: z.string().trim().min(1).max(200),
  pricingBasisVersion: z.string().trim().min(1).max(120),
  warnings: z.array(z.string().trim().min(1).max(240)),
  customerMessage: z.string().trim().min(1).max(400),
  components: z.array(
    z.object({
      code: z.enum(["material", "fabrication", "mounting", "packaging", "margin"]),
      label: z.string().trim().min(1).max(120),
      amountCents: z.number().int().min(0)
    })
  )
});

export const configurableProductEligibilitySchema = z.object({
  instantPriceEligible: z.boolean(),
  reviewRequired: z.boolean(),
  consultRequired: z.boolean(),
  reasonCodes: z.array(z.string().trim().min(1).max(120)),
  customerFacingMessage: z.string().trim().min(1).max(400),
  allowedCheckoutMode: z.enum(["STANDARD_CHECKOUT", "REVIEW_ONLY"]),
  fallbackMode: z.enum(["REQUEST_REVIEW", "NONE"])
});

const storefrontContactSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(240),
  phone: z.string().trim().max(40).nullable().optional()
});

const storefrontAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  address1: z.string().trim().min(1).max(200),
  address2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(24),
  country: z.string().trim().min(1).max(120)
});

export const storefrontShippingDestinationSchema = z.object({
  postalCode: z.string().trim().min(1).max(24),
  countryCode: z.string().trim().min(1).max(3),
  stateOrProvinceCode: z.string().trim().min(1).max(120),
  city: z.string().trim().max(120).nullable().optional(),
  residentialIndicator: z.boolean().nullable().optional()
});

export const storefrontShippingResultSchema = z.object({
  productFamily: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  shippingEligible: z.boolean(),
  reviewRequired: z.boolean(),
  consultRequired: z.boolean(),
  shippingMode: z.enum(shippingModes),
  packagingProfile: z.enum(packagingProfiles),
  shippingCostCents: z.number().int().min(0),
  estimatedTransitDays: z.number().int().min(0).nullable(),
  carrierName: z.string().trim().min(1).max(120).nullable(),
  serviceLevel: z.string().trim().min(1).max(120).nullable(),
  quoteSource: z.enum(shippingQuoteSources),
  quoteReference: z.string().trim().min(1).max(160).nullable(),
  quoteExpiresAt: z.string().datetime().nullable(),
  rawProviderSummary: z.record(z.string(), z.unknown()).nullable(),
  fallbackUsed: z.boolean(),
  shippingWarnings: z.array(z.string().trim().min(1).max(400)),
  shippingReasonCodes: z.array(z.string().trim().min(1).max(120)),
  destinationZone: z.string().trim().min(1).max(120),
  shippingBasisVersion: z.string().trim().min(1).max(120),
  quoteGeneratedAt: z.string().datetime(),
  customerFacingMessage: z.string().trim().min(1).max(400),
  destinationSummary: z.object({
    countryCode: z.string().trim().min(1).max(3),
    stateOrProvinceCode: z.string().trim().min(1).max(120),
    postalCodePrefix: z.string().trim().min(1).max(12)
  })
});

export const storefrontTaxResultSchema = z.object({
  taxEligible: z.boolean(),
  reviewRequired: z.boolean(),
  quoteSource: z.enum(taxQuoteSources),
  taxAmountCents: z.number().int().min(0),
  taxableSubtotalCents: z.number().int().min(0),
  taxableShippingCents: z.number().int().min(0),
  jurisdictionSummary: z.object({
    countryCode: z.string().trim().min(1).max(3),
    stateOrProvinceCode: z.string().trim().min(1).max(120),
    postalCodePrefix: z.string().trim().min(1).max(12)
  }),
  taxRateBasisPoints: z.number().int().min(0).nullable(),
  taxWarnings: z.array(z.string().trim().min(1).max(400)),
  taxReasonCodes: z.array(z.string().trim().min(1).max(120)),
  taxBasisVersion: z.string().trim().min(1).max(120),
  quoteGeneratedAt: z.string().datetime(),
  quoteExpiresAt: z.string().datetime().nullable(),
  quoteReference: z.string().trim().min(1).max(160).nullable(),
  fallbackUsed: z.boolean(),
  rawProviderSummary: z.record(z.string(), z.unknown()).nullable(),
  customerFacingMessage: z.string().trim().min(1).max(400)
});

const storefrontOrderDraftBaseSchema = z.object({
  sourceChannel: z.literal("CRAFT_BOARD"),
  eligibilityResult: configurableProductEligibilitySchema,
  instantPriceEligible: z.boolean(),
  consultRequired: z.boolean(),
  customer: storefrontContactSchema,
  shippingAddress: storefrontAddressSchema,
  billingSameAsShipping: z.boolean(),
  billingAddress: storefrontAddressSchema.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  paymentMode: z.enum(paymentModes),
  orderIntent: z.enum(orderIntents),
  customerAcceptedPricingBasis: z.literal(true),
  customerAcceptedLeadTimeBasis: z.literal(true),
  customerAcknowledgedMadeToOrder: z.literal(true)
});

export const storefrontShelfOrderDraftSchema = storefrontOrderDraftBaseSchema.extend({
  productFamily: z.literal("floating-shelves"),
  productSlug: z.literal("classic-floating-shelf"),
  configuration: floatingShelfConfigurationSchema,
  pricingResult: floatingShelfPricingResultSchema
});

export const storefrontMantelOrderDraftSchema = storefrontOrderDraftBaseSchema.extend({
  productFamily: z.literal("floating-mantels"),
  productSlug: z.literal("classic-floating-mantel"),
  configuration: floatingMantelConfigurationSchema,
  pricingResult: floatingMantelPricingResultSchema
});

export const submitStorefrontOrderSchema = z.object({
  sourcePath: z.string().trim().max(300).nullable().optional(),
  draft: z.discriminatedUnion("productSlug", [
    storefrontShelfOrderDraftSchema,
    storefrontMantelOrderDraftSchema
  ])
});

export const storefrontProductQuoteSchema = z.object({
  configuration: z.discriminatedUnion("productSlug", [
    floatingShelfConfigurationSchema,
    floatingMantelConfigurationSchema
  ]),
  destination: storefrontShippingDestinationSchema
});

export const storefrontAttemptParamsSchema = z.object({
  id: z.string().trim().min(1).max(120)
});

export const storefrontStatusTokenParamsSchema = z.object({
  publicToken: z.string().trim().min(12).max(120)
});

export const storefrontChangeRequestCreateSchema = z.object({
  requestType: z.enum(changeRequestTypes),
  requestedByName: z.string().trim().min(1).max(160),
  requestedByEmail: z.string().trim().email().max(240),
  requestedByPhone: z.string().trim().max(40).nullable().optional(),
  customerMessage: z.string().trim().min(1).max(3000),
  requestedChanges: z.object({
    proposedDimensions: z
      .object({
        width: z.number().positive().max(240).nullable().optional(),
        depth: z.number().positive().max(48).nullable().optional(),
        thickness: z.number().positive().max(12).nullable().optional(),
        length: z.number().positive().max(240).nullable().optional(),
        height: z.number().positive().max(24).nullable().optional(),
        unit: z.literal("IN").nullable().optional()
      })
      .nullable()
      .optional(),
    requestedMaterialOrFinish: z.string().trim().max(240).nullable().optional(),
    requestedMounting: z.string().trim().max(240).nullable().optional(),
    requestedShippingAddress: storefrontAddressSchema.partial()
      .extend({
        fullName: z.string().trim().min(1).max(160),
        address1: z.string().trim().min(1).max(200),
        city: z.string().trim().min(1).max(120),
        state: z.string().trim().min(1).max(120),
        postalCode: z.string().trim().min(1).max(24),
        country: z.string().trim().min(1).max(120)
      })
      .nullable()
      .optional(),
    holdReason: z.string().trim().max(1000).nullable().optional(),
    cancelReason: z.string().trim().max(1000).nullable().optional(),
    generalNotes: z.string().trim().max(2000).nullable().optional()
  })
}).superRefine((value, ctx) => {
  if (value.requestType === "UPDATE_SHIPPING_ADDRESS" && !value.requestedChanges.requestedShippingAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A requested shipping address is required for shipping address updates.",
      path: ["requestedChanges", "requestedShippingAddress"]
    });
  }
});

export const storefrontOrderIssueCreateSchema = z.object({
  issueType: z.enum(orderIssueTypes),
  reportedByName: z.string().trim().min(1).max(160),
  reportedByEmail: z.string().trim().email().max(240),
  reportedByPhone: z.string().trim().max(40).nullable().optional(),
  customerMessage: z.string().trim().min(1).max(3000),
  issueDetails: z.object({
    damageDescription: z.string().trim().max(2000).nullable().optional(),
    packageConditionDescription: z.string().trim().max(2000).nullable().optional(),
    missingItems: z.string().trim().max(2000).nullable().optional(),
    expectedItemDetails: z.string().trim().max(2000).nullable().optional(),
    receivedItemDetails: z.string().trim().max(2000).nullable().optional(),
    qualityIssueDescription: z.string().trim().max(2000).nullable().optional(),
    deliveryProblemDescription: z.string().trim().max(2000).nullable().optional(),
    returnReason: z.string().trim().max(2000).nullable().optional(),
    generalNotes: z.string().trim().max(2000).nullable().optional(),
    customerAttachmentSummary: z.object({
      attachmentCount: z.number().int().min(0).max(24).nullable().optional(),
      note: z.string().trim().max(500).nullable().optional()
    }).nullable().optional()
  })
}).superRefine((value, ctx) => {
  if (value.issueType === "RETURN_REQUEST" && !value.issueDetails.returnReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A return reason is required for return requests.",
      path: ["issueDetails", "returnReason"]
    });
  }
});

export const storefrontPaymentSessionSchema = z.object({
  successPath: z.string().trim().max(300).nullable().optional(),
  cancelPath: z.string().trim().max(300).nullable().optional()
});

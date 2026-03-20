import type { CraftBoardFulfillmentHandoff, FieldMetriqFulfillmentIntakePayload } from "./types.js";

export function mapFulfillmentHandoffToFieldMetriqOrderPayload(input: {
  handoff: CraftBoardFulfillmentHandoff;
}): FieldMetriqFulfillmentIntakePayload {
  const { handoff } = input;

  return {
    requestId: handoff.sourceMetadata.requestId,
    source: "CRAFT_BOARD",
    sourceFlow: handoff.sourceMetadata.sourceFlow,
    handoffVersion: handoff.sourceMetadata.handoffVersion,
    storefrontAttempt: {
      id: handoff.sourceMetadata.storefrontOrderAttemptId,
      requestId: handoff.sourceMetadata.requestId,
      reference: handoff.sourceMetadata.storefrontOrderAttemptReference,
      paidAt: handoff.sourceMetadata.paidAt,
      submittedAt: handoff.sourceMetadata.submittedAt
    },
    customer: {
      name: handoff.customerSnapshot.customerName,
      email: handoff.customerSnapshot.customerEmail,
      phone: handoff.customerSnapshot.customerPhone
    },
    shippingDestination: {
      name: handoff.customerSnapshot.shippingName,
      address1: handoff.customerSnapshot.shippingAddress1,
      address2: handoff.customerSnapshot.shippingAddress2,
      city: handoff.customerSnapshot.shippingCity,
      stateOrProvince: handoff.customerSnapshot.shippingStateOrProvince,
      postalCode: handoff.customerSnapshot.shippingPostalCode,
      country: handoff.customerSnapshot.shippingCountry
    },
    commercialSummary: handoff.commercialSnapshot,
    product: handoff.productSnapshot,
    shipping: handoff.shippingSnapshot,
    tax: handoff.taxSnapshot,
    payment: handoff.paymentSnapshot,
    fulfillmentRouting: handoff.fulfillmentRoutingSnapshot,
    traceMetadata: handoff.traceMetadata
  };
}

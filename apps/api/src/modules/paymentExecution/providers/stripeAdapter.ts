import crypto from "node:crypto";
import type {
  PaymentProviderAdapter,
  ProviderExecutionFetchInput,
  ProviderExecutionFetchResult,
  ProviderExecutionSessionInput,
  ProviderExecutionSessionResult,
  ProviderMappedEvent,
  ProviderNormalizedEvent,
  ProviderRawEventInput
} from "./types.js";

function normalizeObject(input: unknown) {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mapStripeObjectStatusToExecutionStatus(status: unknown): ProviderExecutionFetchResult["status"] | null {
  const value = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (value === "complete" || value === "completed" || value === "succeeded" || value === "paid") {
    return "COMPLETED";
  }
  if (value === "expired") {
    return "EXPIRED";
  }
  if (value === "canceled" || value === "cancelled") {
    return "CANCELED";
  }
  if (value === "failed") {
    return "FAILED";
  }
  if (value === "open" || value === "created") {
    return "OPEN";
  }
  return null;
}

function mapStripeEventTypeToPaymentStatus(eventType: string): ProviderNormalizedEvent["paymentStatus"] {
  if (eventType.includes("payment_intent.succeeded") || eventType.includes("checkout.session.completed")) {
    return "SUCCEEDED";
  }
  if (eventType.includes("payment_intent.payment_failed")) {
    return "FAILED";
  }
  if (eventType.includes("payment_intent.canceled") || eventType.includes("checkout.session.expired")) {
    return "CANCELED";
  }
  return null;
}

function mapStripeEventTypeToExecutionStatus(eventType: string): ProviderNormalizedEvent["executionStatus"] {
  if (eventType.includes("checkout.session.completed") || eventType.includes("payment_intent.succeeded")) {
    return "COMPLETED";
  }
  if (eventType.includes("checkout.session.expired")) {
    return "EXPIRED";
  }
  if (eventType.includes("payment_intent.canceled")) {
    return "CANCELED";
  }
  if (eventType.includes("payment_intent.payment_failed")) {
    return "FAILED";
  }
  return null;
}

export const stripeAdapter: PaymentProviderAdapter = {
  provider: "STRIPE",

  async createExecutionSession(input: ProviderExecutionSessionInput): Promise<ProviderExecutionSessionResult> {
    const token = crypto.randomUUID();

    return {
      status: "OPEN",
      providerSessionId: `stripe_cs_${token}`,
      providerPaymentIntentId: `stripe_pi_${token}`,
      providerUrl: `https://payments.fieldmetriq.test/checkout/${token}`,
      externalReference: input.externalReference ?? `exec_${input.executionId}`,
      initiatedAt: new Date(),
      metadata: {
        stubbed: true,
        source: "stripeAdapter"
      }
    };
  },

  async fetchExecutionStatus(input: ProviderExecutionFetchInput): Promise<ProviderExecutionFetchResult> {
    const metadata = normalizeObject(input.metadata);
    const forcedStatus = mapStripeObjectStatusToExecutionStatus(metadata.stubbedStatus);
    const status = forcedStatus ?? input.status;

    return {
      status,
      providerSessionId: input.providerSessionId ?? null,
      providerPaymentIntentId: input.providerPaymentIntentId ?? null,
      externalReference: input.externalReference ?? null,
      completedAt: status === "COMPLETED" ? new Date() : null,
      expiredAt: status === "EXPIRED" ? new Date() : null,
      canceledAt: status === "CANCELED" ? new Date() : null,
      metadata: {
        ...(metadata as Record<string, unknown>),
        stubbed: true,
        lastRefreshProvider: "STRIPE"
      }
    };
  },

  async mapIncomingEvent(input: ProviderRawEventInput): Promise<ProviderMappedEvent> {
    const payload = normalizeObject(input.payload);
    const data = normalizeObject(payload.data);
    const object = normalizeObject(data.object);
    const eventType = typeof payload.type === "string" ? payload.type : "provider.event.unknown";

    return {
      provider: "STRIPE",
      eventType,
      providerEventId: typeof payload.id === "string" ? payload.id : null,
      providerObjectId: typeof object.id === "string" ? object.id : null,
      providerSessionId:
        typeof object.id === "string" && eventType.startsWith("checkout.session")
          ? object.id
          : typeof object.checkout_session === "string"
            ? object.checkout_session
            : null,
      providerPaymentIntentId:
        typeof object.payment_intent === "string"
          ? object.payment_intent
          : typeof object.id === "string" && eventType.startsWith("payment_intent")
            ? object.id
            : null,
      externalReference: typeof object.client_reference_id === "string" ? object.client_reference_id : null,
      paymentStatus: mapStripeEventTypeToPaymentStatus(eventType),
      executionStatus: mapStripeEventTypeToExecutionStatus(eventType),
      metadata: {
        headerSignaturePresent: Boolean(input.headers["stripe-signature"]),
        stubbed: true
      }
    };
  },

  async normalizeEventToCanonical(input: ProviderMappedEvent): Promise<ProviderNormalizedEvent> {
    const providerEventId = input.providerEventId?.trim() || `stripe_stub_${crypto.randomUUID()}`;

    return {
      provider: "STRIPE",
      eventType: input.eventType,
      providerEventId,
      providerObjectId: input.providerObjectId ?? null,
      providerSessionId: input.providerSessionId ?? null,
      providerPaymentIntentId: input.providerPaymentIntentId ?? null,
      externalReference: input.externalReference ?? null,
      dedupeKey: `STRIPE:${providerEventId}`,
      paymentStatus: input.paymentStatus ?? null,
      executionStatus: input.executionStatus ?? null,
      metadata: input.metadata ?? null
    };
  }
};

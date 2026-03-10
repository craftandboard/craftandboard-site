export type SupportedPaymentProvider = "STRIPE";
export type PaymentExecutionModeValue = "HOSTED_CHECKOUT" | "PAYMENT_LINK" | "MANUAL_PROVIDER_SESSION";
export type PaymentExecutionStatusValue = "CREATED" | "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELED" | "FAILED";
export type CanonicalPaymentStatusValue = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED";

export type ProviderExecutionSessionInput = {
  executionId: string;
  organizationId: string;
  proposalId: string;
  depositRequestId?: string | null;
  paymentId?: string | null;
  provider: SupportedPaymentProvider;
  mode: PaymentExecutionModeValue;
  amountCents: number;
  currency: string;
  externalReference?: string | null;
  metadata?: unknown;
};

export type ProviderExecutionSessionResult = {
  status: PaymentExecutionStatusValue;
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  providerCustomerId?: string | null;
  providerUrl?: string | null;
  externalReference?: string | null;
  initiatedAt?: Date | null;
  metadata?: unknown;
};

export type ProviderExecutionFetchInput = {
  executionId: string;
  provider: SupportedPaymentProvider;
  status: PaymentExecutionStatusValue;
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  externalReference?: string | null;
  metadata?: unknown;
};

export type ProviderExecutionFetchResult = {
  status: PaymentExecutionStatusValue;
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  providerCustomerId?: string | null;
  providerUrl?: string | null;
  externalReference?: string | null;
  completedAt?: Date | null;
  expiredAt?: Date | null;
  canceledAt?: Date | null;
  metadata?: unknown;
};

export type ProviderRawEventInput = {
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type ProviderMappedEvent = {
  provider: SupportedPaymentProvider;
  eventType: string;
  providerEventId?: string | null;
  providerObjectId?: string | null;
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  externalReference?: string | null;
  paymentStatus?: CanonicalPaymentStatusValue | null;
  executionStatus?: PaymentExecutionStatusValue | null;
  metadata?: unknown;
};

export type ProviderNormalizedEvent = {
  provider: SupportedPaymentProvider;
  eventType: string;
  providerEventId: string;
  providerObjectId?: string | null;
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  externalReference?: string | null;
  dedupeKey?: string | null;
  paymentStatus?: CanonicalPaymentStatusValue | null;
  executionStatus?: PaymentExecutionStatusValue | null;
  metadata?: unknown;
};

export interface PaymentProviderAdapter {
  provider: SupportedPaymentProvider;
  createExecutionSession(input: ProviderExecutionSessionInput): Promise<ProviderExecutionSessionResult>;
  fetchExecutionStatus(input: ProviderExecutionFetchInput): Promise<ProviderExecutionFetchResult>;
  mapIncomingEvent(input: ProviderRawEventInput): Promise<ProviderMappedEvent>;
  normalizeEventToCanonical(input: ProviderMappedEvent): Promise<ProviderNormalizedEvent>;
}

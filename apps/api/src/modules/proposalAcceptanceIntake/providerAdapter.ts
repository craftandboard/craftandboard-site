export class UnknownAcceptanceProviderError extends Error {}

export type NormalizedProviderAcceptanceSignal = {
  provider: string;
  intakeId?: string | null;
  proposalLookup?: string | null;
  providerReference: string;
  confirmed: boolean;
  signerName?: string | null;
  signerEmail?: string | null;
  note?: string | null;
  payload: unknown;
  metadata?: unknown;
};

export interface AcceptanceProviderAdapter {
  provider: string;
  normalizeSignal(input: {
    payload: unknown;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<NormalizedProviderAcceptanceSignal>;
}

const stripeAcceptanceAdapter: AcceptanceProviderAdapter = {
  provider: "STRIPE",
  async normalizeSignal(input) {
    const payload = (input.payload ?? {}) as Record<string, unknown>;
    const providerReference =
      typeof payload.providerReference === "string"
        ? payload.providerReference
        : typeof payload.id === "string"
          ? payload.id
          : typeof payload.eventId === "string"
            ? payload.eventId
            : "";

    if (!providerReference.trim()) {
      throw new Error("Provider reference is required.");
    }

    return {
      provider: "STRIPE",
      intakeId: typeof payload.intakeId === "string" ? payload.intakeId : null,
      proposalLookup:
        typeof payload.proposalLookup === "string"
          ? payload.proposalLookup
          : typeof payload.proposalId === "string"
            ? payload.proposalId
            : typeof payload.proposalPublicToken === "string"
              ? payload.proposalPublicToken
              : null,
      providerReference,
      confirmed: payload.confirmed === false ? false : true,
      signerName: typeof payload.signerName === "string" ? payload.signerName : null,
      signerEmail: typeof payload.signerEmail === "string" ? payload.signerEmail : null,
      note: typeof payload.note === "string" ? payload.note : null,
      payload: input.payload,
      metadata: typeof payload.metadata === "object" ? payload.metadata : undefined
    };
  }
};

const registry: Record<string, AcceptanceProviderAdapter> = {
  STRIPE: stripeAcceptanceAdapter
};

export function getAcceptanceProviderAdapter(provider: string): AcceptanceProviderAdapter {
  const normalized = provider.trim().toUpperCase();
  const adapter = registry[normalized];

  if (!adapter) {
    throw new UnknownAcceptanceProviderError(`Unknown acceptance provider ${provider}.`);
  }

  return adapter;
}

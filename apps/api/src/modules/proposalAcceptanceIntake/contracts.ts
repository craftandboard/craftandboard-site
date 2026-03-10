export type ProposalAcceptanceIntakeView = {
  id: string;
  orgId: string;
  proposalId: string;
  status: string;
  source: string;
  tokenExpiresAt: string | null;
  openedAt: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  handedOffAt: string | null;
  expiredAt: string | null;
  revokedAt: string | null;
  failedAt: string | null;
  externalIdentityName: string | null;
  externalIdentityEmail: string | null;
  externalIp: string | null;
  externalUserAgent: string | null;
  provider: string | null;
  providerReference: string | null;
  note: string | null;
  payload: unknown;
  verificationSnapshot: unknown;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProposalAcceptanceEvidenceView = {
  id: string;
  orgId: string;
  proposalId: string;
  intakeId: string;
  kind: string;
  value: string | null;
  details: unknown;
  createdAt: string;
};

export type ProposalAcceptanceIntakeLogView = {
  id: string;
  orgId: string;
  proposalId: string;
  intakeId: string | null;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: string;
};

export type ProposalAcceptanceVerificationView = {
  verified: boolean;
  reasons: string[];
  normalizedDecisionSource: "MANUAL_EXTERNAL" | "PROVIDER_CONFIRMED";
  evidenceSummary: Array<{
    kind: string;
    value?: string | null;
  }>;
  handoffAllowed: boolean;
};

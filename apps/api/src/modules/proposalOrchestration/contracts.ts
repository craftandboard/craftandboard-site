export type ProposalAcceptanceView = {
  id: string;
  orgId: string;
  proposalId: string;
  status: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  canceledAt: string | null;
  acceptedByMembershipId: string | null;
  rejectedByMembershipId: string | null;
  canceledByMembershipId: string | null;
  decisionSource: string;
  note: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ProposalConversionView = {
  id: string;
  orgId: string;
  proposalId: string;
  leadId: string | null;
  acceptanceId: string | null;
  status: string;
  eligibilitySnapshot: unknown;
  blockedReasonCode: string | null;
  blockedReasonMessage: string | null;
  convertedAt: string | null;
  projectId: string | null;
  initiatedByMembershipId: string | null;
  completedByMembershipId: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ProposalEligibilityView = {
  eligible: boolean;
  reasons: string[];
  requiredActions: string[];
  snapshot: Record<string, unknown>;
};

export type ProposalOrchestrationLogView = {
  id: string;
  orgId: string;
  proposalId: string;
  acceptanceId: string | null;
  conversionId: string | null;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: string;
};

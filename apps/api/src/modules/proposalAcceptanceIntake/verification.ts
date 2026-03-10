import type { ProposalAcceptanceVerificationView } from "./contracts.js";

type VerificationProposal = {
  id: string;
  status: string | null;
  acceptance: { id: string; status: string } | null;
  conversion: { id: string; status: string; projectId: string | null } | null;
  project: { id: string } | null;
};

type VerificationIntake = {
  id: string;
  status: string;
  source: string;
  tokenExpiresAt: Date | null;
  revokedAt: Date | null;
  expiredAt: Date | null;
};

export function verifyAcceptanceIntakeSubmission(input: {
  proposal: VerificationProposal;
  intake: VerificationIntake;
  confirmed: boolean;
  signerName?: string | null;
  signerEmail?: string | null;
  externalIp?: string | null;
  externalUserAgent?: string | null;
  providerReference?: string | null;
  now?: Date;
}): ProposalAcceptanceVerificationView {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  const evidenceSummary: Array<{ kind: string; value?: string | null }> = [];

  if (input.intake.revokedAt || input.intake.status === "REVOKED") {
    reasons.push("intake_revoked");
  }
  if (
    input.intake.expiredAt ||
    input.intake.status === "EXPIRED" ||
    (input.intake.tokenExpiresAt && input.intake.tokenExpiresAt.getTime() < now.getTime())
  ) {
    reasons.push("token_expired");
  }

  const normalizedProposalStatus = input.proposal.status?.trim().toLowerCase() ?? "";
  if (["rejected", "archived"].includes(normalizedProposalStatus)) {
    reasons.push("proposal_state_blocked");
  }
  if (input.proposal.conversion?.status === "CONVERTED" || input.proposal.project?.id || input.proposal.conversion?.projectId) {
    reasons.push("proposal_already_converted");
  }

  if (!input.confirmed) {
    reasons.push("confirmation_required");
  } else {
    evidenceSummary.push({ kind: "CHECKBOX_CONFIRMATION", value: "true" });
  }

  if (input.intake.source === "PROVIDER_CALLBACK") {
    if (!input.providerReference?.trim()) {
      reasons.push("provider_reference_required");
    } else {
      evidenceSummary.push({ kind: "PROVIDER_ASSERTION", value: input.providerReference.trim() });
    }
  } else if (!input.signerName?.trim()) {
    reasons.push("typed_name_required");
  } else {
    evidenceSummary.push({ kind: "TYPED_NAME", value: input.signerName.trim() });
  }

  if (input.signerEmail?.trim()) {
    evidenceSummary.push({ kind: "EMAIL_MATCH", value: input.signerEmail.trim().toLowerCase() });
  }
  if (input.externalIp?.trim()) {
    evidenceSummary.push({ kind: "IP_CAPTURE", value: input.externalIp.trim() });
  }
  if (input.externalUserAgent?.trim()) {
    evidenceSummary.push({ kind: "USER_AGENT_CAPTURE", value: input.externalUserAgent.trim() });
  }

  const normalizedDecisionSource =
    input.intake.source === "PROVIDER_CALLBACK" ? "PROVIDER_CONFIRMED" : "MANUAL_EXTERNAL";

  return {
    verified: reasons.length === 0,
    reasons,
    normalizedDecisionSource,
    evidenceSummary,
    handoffAllowed: reasons.length === 0
  };
}

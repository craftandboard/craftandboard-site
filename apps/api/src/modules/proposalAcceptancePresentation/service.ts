import type {
  ProposalAcceptancePresentationLogView,
  PublicAcceptanceConfirmationView,
  PublicAcceptanceInstructionsView,
  PublicAcceptancePresentationView
} from "./contracts.js";
import { writeProposalAcceptancePresentationLog } from "./audit.js";
import { buildPublicConfirmation } from "./confirmation.js";
import { buildSignerInstructions } from "./instructions.js";
import {
  getPresentationBundleByTokenHash,
  listProposalAcceptancePresentationLogsForProposal
} from "./repository.js";
import { resolvePresentationState } from "./state.js";
import { hashAcceptanceToken } from "../proposalAcceptanceIntake/token.js";
import { getProposalPaymentSummaryView } from "../payments/service.js";

type PresentationBundle = {
  id: string;
  organizationId: string;
  proposalId: string;
  status: string;
  source: string;
  tokenExpiresAt: Date | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  handedOffAt: Date | null;
  expiredAt: Date | null;
  revokedAt: Date | null;
  failedAt: Date | null;
  note: string | null;
  proposal: {
    id: string;
    status: string | null;
    depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
    acceptance: { status: string; acceptedAt: Date | null } | null;
    conversion: { status: string; projectId: string | null } | null;
    project: { id: string } | null;
  };
};

type PresentationLogRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  intakeId: string;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: Date;
};

export class ProposalAcceptancePresentationTokenError extends Error {}

function mapLog(record: PresentationLogRecord): ProposalAcceptancePresentationLogView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    intakeId: record.intakeId,
    action: record.action,
    outcome: record.outcome,
    message: record.message,
    details: record.details,
    createdAt: record.createdAt.toISOString()
  };
}

async function getValidPresentationBundle(token: string) {
  const bundle = (await getPresentationBundleByTokenHash({
    tokenHash: hashAcceptanceToken(token)
  })) as PresentationBundle | null;

  if (!bundle) {
    throw new ProposalAcceptancePresentationTokenError("Invalid or expired acceptance token.");
  }

  const now = Date.now();
  if (
    bundle.revokedAt ||
    bundle.expiredAt ||
    (bundle.tokenExpiresAt && bundle.tokenExpiresAt.getTime() < now)
  ) {
    throw new ProposalAcceptancePresentationTokenError("Invalid or expired acceptance token.");
  }

  return bundle;
}

async function buildPresentationContext(token: string, view: "state" | "instructions" | "ready" | "confirmation") {
  const bundle = await getValidPresentationBundle(token);
  const paymentSummary = await getProposalPaymentSummaryView({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId
  });

  const presentation = resolvePresentationState({
    bundle,
    view
  });

  return {
    bundle,
    paymentSummary: paymentSummary.summary,
    presentation
  };
}

async function logBlockedIfNeeded(input: {
  bundle: PresentationBundle;
  presentation: PublicAcceptancePresentationView;
  message: string;
}) {
  if (!input.presentation.reviewAllowed || ["BLOCKED", "EXPIRED"].includes(input.presentation.state)) {
    await writeProposalAcceptancePresentationLog({
      organizationId: input.bundle.organizationId,
      proposalId: input.bundle.proposalId,
      intakeId: input.bundle.id,
      action: "PRESENTATION_BLOCKED",
      outcome: "SKIPPED",
      message: input.message,
      details: {
        blockedReasons: input.presentation.blockedReasons,
        state: input.presentation.state
      }
    });
    return true;
  }

  return false;
}

export async function getPublicPresentationState(input: { token: string }) {
  const { bundle, presentation } = await buildPresentationContext(input.token, "state");

  const blocked = await logBlockedIfNeeded({
    bundle,
    presentation,
    message: "Presentation state blocked."
  });

  if (!blocked) {
    await writeProposalAcceptancePresentationLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "PRESENTATION_VIEWED",
      outcome: "APPLIED",
      message: "Presentation state returned.",
      details: {
        state: presentation.state
      }
    });
  }

  return {
    ok: true,
    presentation
  };
}

export async function getSignerInstructions(input: { token: string }) {
  const { bundle, presentation, paymentSummary } = await buildPresentationContext(input.token, "instructions");

  const blocked = await logBlockedIfNeeded({
    bundle,
    presentation,
    message: "Instructions blocked."
  });

  const instructions = buildSignerInstructions({
    state: presentation.state,
    reviewAllowed: presentation.reviewAllowed,
    blockedReasons: presentation.blockedReasons,
    nextActions: presentation.nextActions,
    depositRequired: bundle.proposal.depositPolicy === "DEPOSIT_REQUIRED_BEFORE_CONVERSION",
    depositOutstandingAmountCents: paymentSummary.depositRequestedAmountCents - paymentSummary.depositPaidAmountCents,
    note: bundle.note
  });

  if (!blocked) {
    await writeProposalAcceptancePresentationLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "INSTRUCTIONS_RETURNED",
      outcome: "APPLIED",
      message: "Signer instructions returned."
    });
  }

  return {
    ok: true,
    instructions
  };
}

export async function getReadyToConfirmState(input: { token: string }) {
  const { bundle, presentation } = await buildPresentationContext(input.token, "ready");

  const blocked = await logBlockedIfNeeded({
    bundle,
    presentation,
    message: "Ready state blocked."
  });

  if (!blocked) {
    await writeProposalAcceptancePresentationLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "READY_STATE_RETURNED",
      outcome: "APPLIED",
      message: "Ready-to-confirm state returned.",
      details: {
        state: presentation.state
      }
    });
  }

  return {
    ok: true,
    ready: presentation
  };
}

export async function getSubmissionCompleteState(input: { token: string }) {
  const { bundle, presentation } = await buildPresentationContext(input.token, "confirmation");

  const blocked = await logBlockedIfNeeded({
    bundle,
    presentation,
    message: "Submission state blocked."
  });

  if (!blocked) {
    await writeProposalAcceptancePresentationLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "SUBMISSION_STATE_RETURNED",
      outcome: "APPLIED",
      message: "Submission-complete state returned."
    });
  }

  return {
    ok: true,
    submission: presentation
  };
}

export async function getPublicConfirmation(input: { token: string }) {
  const { bundle, presentation } = await buildPresentationContext(input.token, "confirmation");

  const blocked = await logBlockedIfNeeded({
    bundle,
    presentation,
    message: "Confirmation blocked."
  });

  const confirmation = buildPublicConfirmation({
    state: presentation.state,
    blockedReasons: presentation.blockedReasons,
    submissionCompleted: presentation.submissionCompleted,
    confirmationCompleted: presentation.confirmationCompleted,
    submittedAt: bundle.submittedAt,
    confirmedAt: bundle.proposal.acceptance?.acceptedAt ?? bundle.handedOffAt
  });

  if (!blocked) {
    await writeProposalAcceptancePresentationLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "CONFIRMATION_RETURNED",
      outcome: "APPLIED",
      message: "Confirmation view returned."
    });
  }

  return {
    ok: true,
    confirmation
  };
}

export async function recordPresentationViewed(input: { token: string }) {
  const { bundle } = await buildPresentationContext(input.token, "state");

  await writeProposalAcceptancePresentationLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "PRESENTATION_VIEWED",
    outcome: "APPLIED",
    message: "Presentation viewed."
  });

  return { ok: true };
}

export async function listPresentationLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  const logs = (await listProposalAcceptancePresentationLogsForProposal(input)) as PresentationLogRecord[];

  return {
    ok: true,
    logs: logs.map(mapLog)
  };
}

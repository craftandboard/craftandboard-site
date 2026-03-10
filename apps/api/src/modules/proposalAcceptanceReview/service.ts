import type { ProposalAcceptanceReviewLogView, PublicProposalReviewView } from "./contracts.js";
import { writeProposalAcceptanceReviewLog } from "./audit.js";
import { listProposalAcceptanceReviewLogsForProposal, getReviewBundleByTokenHash } from "./repository.js";
import { buildSnapshotFromCanonicalProposal } from "./snapshot.js";
import { buildReviewState } from "./tokenView.js";
import { hashAcceptanceToken } from "../proposalAcceptanceIntake/token.js";
import { getProposalPaymentSummaryView } from "../payments/service.js";

type ReviewBundle = {
  id: string;
  organizationId: string;
  proposalId: string;
  status: string;
  source: string;
  tokenExpiresAt: Date | null;
  openedAt: Date | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  handedOffAt: Date | null;
  expiredAt: Date | null;
  revokedAt: Date | null;
  failedAt: Date | null;
  note: string | null;
  proposal: {
    id: string;
    title: string | null;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
    depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
    organization: { name: string } | null;
    acceptance: { id: string; status: string } | null;
    conversion: { id: string; status: string; projectId: string | null } | null;
    project: { id: string } | null;
    sections: Array<{
      title: string;
      lines: Array<{
        name: string;
        description: string | null;
        qty: { toNumber(): number };
        unit: string | null;
        priceCents: number;
      }>;
    }>;
    lines: Array<{
      name: string;
      description: string | null;
      qty: { toNumber(): number };
      unit: string | null;
      priceCents: number;
    }>;
  };
};

type ReviewLogRecord = {
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

export class ProposalAcceptanceReviewTokenError extends Error {
  code: "INVALID" | "EXPIRED" | "REVOKED";

  constructor(message: string, code: "INVALID" | "EXPIRED" | "REVOKED" = "INVALID") {
    super(message);
    this.code = code;
  }
}

function mapLog(record: ReviewLogRecord): ProposalAcceptanceReviewLogView {
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

async function getValidReviewBundle(token: string) {
  const bundle = (await getReviewBundleByTokenHash({
    tokenHash: hashAcceptanceToken(token)
  })) as ReviewBundle | null;

  if (!bundle) {
    throw new ProposalAcceptanceReviewTokenError("Invalid or expired acceptance token.", "INVALID");
  }

  const now = Date.now();
  if (
    bundle.revokedAt ||
    bundle.expiredAt ||
    (bundle.tokenExpiresAt && bundle.tokenExpiresAt.getTime() < now)
  ) {
    await writeProposalAcceptanceReviewLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "REVIEW_BLOCKED",
      outcome: "FAILED",
      message: "Review token was expired or revoked."
    });
    throw new ProposalAcceptanceReviewTokenError(
      "Invalid or expired acceptance token.",
      bundle.revokedAt ? "REVOKED" : "EXPIRED"
    );
  }

  return bundle;
}

function buildBlockedView(input: {
  intakeStatus: string;
  blockedReasons: string[];
}): PublicProposalReviewView {
  return {
    reviewAllowed: false,
    intakeStatus: input.intakeStatus,
    blockedReasons: input.blockedReasons,
    nextActions: [],
    proposal: null,
    instructions: null
  };
}

export async function validateReviewToken(input: { token: string }) {
  const bundle = await getValidReviewBundle(input.token);

  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "TOKEN_VALIDATED_FOR_REVIEW",
    outcome: "APPLIED",
    message: "Acceptance review token validated."
  });

  const gating = buildReviewState({
    intakeStatus: bundle.status,
    proposalStatus: bundle.proposal.status,
    acceptanceStatus: bundle.proposal.acceptance?.status ?? null,
    conversionStatus: bundle.proposal.conversion?.status ?? null,
    hasProject: Boolean(bundle.proposal.project?.id ?? bundle.proposal.conversion?.projectId)
  });

  if (!gating.reviewAllowed) {
    await writeProposalAcceptanceReviewLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "REVIEW_BLOCKED",
      outcome: "SKIPPED",
      message: "Acceptance review was blocked.",
      details: {
        blockedReasons: gating.blockedReasons
      }
    });
  }

  return {
    ok: true,
    reviewAllowed: gating.reviewAllowed,
    intakeStatus: bundle.status,
    blockedReasons: gating.blockedReasons,
    nextActions: gating.nextActions
  };
}

export async function getPublicProposalSnapshot(input: { token: string }) {
  const bundle = await getValidReviewBundle(input.token);

  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "TOKEN_VALIDATED_FOR_REVIEW",
    outcome: "APPLIED",
    message: "Acceptance review token validated."
  });

  const gating = buildReviewState({
    intakeStatus: bundle.status,
    proposalStatus: bundle.proposal.status,
    acceptanceStatus: bundle.proposal.acceptance?.status ?? null,
    conversionStatus: bundle.proposal.conversion?.status ?? null,
    hasProject: Boolean(bundle.proposal.project?.id ?? bundle.proposal.conversion?.projectId)
  });

  if (!gating.reviewAllowed) {
    await writeProposalAcceptanceReviewLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "REVIEW_BLOCKED",
      outcome: "SKIPPED",
      message: "Acceptance review was blocked.",
      details: {
        blockedReasons: gating.blockedReasons
      }
    });

    return {
      ok: true,
      review: buildBlockedView({
        intakeStatus: bundle.status,
        blockedReasons: gating.blockedReasons
      })
    };
  }

  const paymentSummary = await getProposalPaymentSummaryView({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId
  });

  const snapshot = buildSnapshotFromCanonicalProposal({
    proposal: bundle.proposal,
    paymentSummary: paymentSummary.summary
  });

  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "SNAPSHOT_GENERATED",
    outcome: "APPLIED",
    message: "Public proposal snapshot generated."
  });
  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "SNAPSHOT_VIEWED",
    outcome: "APPLIED",
    message: "Public proposal snapshot viewed."
  });

  return {
    ok: true,
    review: {
      reviewAllowed: true,
      intakeStatus: bundle.status,
      blockedReasons: [],
      nextActions: gating.nextActions,
      proposal: snapshot,
      instructions:
        bundle.note?.trim() || "Review the proposal summary and confirm acceptance if it matches your understanding."
    } satisfies PublicProposalReviewView
  };
}

export async function getPublicReviewContext(input: { token: string }) {
  const bundle = await getValidReviewBundle(input.token);

  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "TOKEN_VALIDATED_FOR_REVIEW",
    outcome: "APPLIED",
    message: "Acceptance review token validated."
  });

  const gating = buildReviewState({
    intakeStatus: bundle.status,
    proposalStatus: bundle.proposal.status,
    acceptanceStatus: bundle.proposal.acceptance?.status ?? null,
    conversionStatus: bundle.proposal.conversion?.status ?? null,
    hasProject: Boolean(bundle.proposal.project?.id ?? bundle.proposal.conversion?.projectId)
  });

  if (!gating.reviewAllowed) {
    await writeProposalAcceptanceReviewLog({
      organizationId: bundle.organizationId,
      proposalId: bundle.proposalId,
      intakeId: bundle.id,
      action: "REVIEW_BLOCKED",
      outcome: "SKIPPED",
      message: "Acceptance review context was blocked.",
      details: { blockedReasons: gating.blockedReasons }
    });

    return {
      ok: true,
      review: buildBlockedView({
        intakeStatus: bundle.status,
        blockedReasons: gating.blockedReasons
      })
    };
  }

  const paymentSummary = await getProposalPaymentSummaryView({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId
  });

  const snapshot = buildSnapshotFromCanonicalProposal({
    proposal: bundle.proposal,
    paymentSummary: paymentSummary.summary
  });

  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "REVIEW_CONTEXT_RETURNED",
    outcome: "APPLIED",
    message: "Public review context returned."
  });

  return {
    ok: true,
    review: {
      reviewAllowed: true,
      intakeStatus: bundle.status,
      blockedReasons: [],
      nextActions: gating.nextActions,
      proposal: snapshot,
      instructions:
        bundle.note?.trim() || "Review the proposal summary and confirm acceptance if it matches your understanding."
    } satisfies PublicProposalReviewView
  };
}

export async function recordSnapshotViewed(input: { token: string }) {
  const bundle = await getValidReviewBundle(input.token);

  await writeProposalAcceptanceReviewLog({
    organizationId: bundle.organizationId,
    proposalId: bundle.proposalId,
    intakeId: bundle.id,
    action: "SNAPSHOT_VIEWED",
    outcome: "APPLIED",
    message: "Public proposal snapshot viewed."
  });

  return {
    ok: true
  };
}

export async function listReviewLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  const logs = (await listProposalAcceptanceReviewLogsForProposal(input)) as ReviewLogRecord[];

  return {
    ok: true,
    logs: logs.map(mapLog)
  };
}

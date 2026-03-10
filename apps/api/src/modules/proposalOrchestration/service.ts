import type {
  ProposalAcceptanceView,
  ProposalConversionView,
  ProposalEligibilityView,
  ProposalOrchestrationLogView
} from "./contracts.js";
import { writeProposalOrchestrationLog } from "./audit.js";
import { evaluateProposalConversionEligibility } from "./eligibility.js";
import { syncLeadWonState } from "./leadAdapter.js";
import { createProjectFromProposal } from "./projectAdapter.js";
import { syncProposalStatus } from "./proposalAdapter.js";
import {
  createProposalAcceptanceRecord,
  createProposalConversionRecord,
  getProposalForOrchestration,
  listProposalOrchestrationLogs,
  updateProposalDepositPolicyForOrganization,
  updateProposalAcceptanceRecord,
  updateProposalConversionRecord
} from "./repository.js";
import {
  canTransitionAcceptanceStatus,
  canTransitionConversionStatus,
  isKnownDecisionSource,
  normalizeDecisionSource
} from "./statusAdapter.js";

type AcceptanceRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  status: string;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  canceledAt: Date | null;
  acceptedByMembershipId: string | null;
  rejectedByMembershipId: string | null;
  canceledByMembershipId: string | null;
  decisionSource: string;
  note: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type ConversionRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  leadId: string | null;
  acceptanceId: string | null;
  status: string;
  eligibilitySnapshot: unknown;
  blockedReasonCode: string | null;
  blockedReasonMessage: string | null;
  convertedAt: Date | null;
  projectId: string | null;
  initiatedByMembershipId: string | null;
  completedByMembershipId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type OrchestrationBundle = {
  id: string;
  organizationId: string;
  title: string | null;
  status: string | null;
  depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  lead: { id: string; name: string | null } | null;
  project: { id: string } | null;
  acceptance: AcceptanceRecord | null;
  conversion: ConversionRecord | null;
};

type LogRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  acceptanceId: string | null;
  conversionId: string | null;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: Date;
};

export class ProposalOrchestrationConflictError extends Error {}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function mapAcceptance(record: AcceptanceRecord): ProposalAcceptanceView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    status: record.status,
    acceptedAt: toIso(record.acceptedAt),
    rejectedAt: toIso(record.rejectedAt),
    canceledAt: toIso(record.canceledAt),
    acceptedByMembershipId: record.acceptedByMembershipId,
    rejectedByMembershipId: record.rejectedByMembershipId,
    canceledByMembershipId: record.canceledByMembershipId,
    decisionSource: record.decisionSource,
    note: record.note,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapConversion(record: ConversionRecord): ProposalConversionView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    leadId: record.leadId,
    acceptanceId: record.acceptanceId,
    status: record.status,
    eligibilitySnapshot: record.eligibilitySnapshot,
    blockedReasonCode: record.blockedReasonCode,
    blockedReasonMessage: record.blockedReasonMessage,
    convertedAt: toIso(record.convertedAt),
    projectId: record.projectId,
    initiatedByMembershipId: record.initiatedByMembershipId,
    completedByMembershipId: record.completedByMembershipId,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapLog(record: LogRecord): ProposalOrchestrationLogView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    acceptanceId: record.acceptanceId,
    conversionId: record.conversionId,
    action: record.action,
    outcome: record.outcome,
    message: record.message,
    details: record.details,
    createdAt: record.createdAt.toISOString()
  };
}

async function getProposalBundle(input: { organizationId: string; proposalId: string }) {
  const proposal = (await getProposalForOrchestration(input)) as OrchestrationBundle | null;

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return proposal;
}

function resolveDecisionSource(raw?: string | null) {
  const normalized = normalizeDecisionSource(raw ?? "MANUAL_INTERNAL");
  if (!isKnownDecisionSource(normalized)) {
    throw new Error("Invalid decision source.");
  }
  return normalized;
}

export async function createOrGetAcceptance(input: {
  organizationId: string;
  proposalId: string;
  decisionSource?: string | null;
  note?: string | null;
  metadata?: unknown;
  depositPolicy?: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
}) {
  const proposal = await getProposalBundle(input);

  if (proposal.acceptance) {
    await writeProposalOrchestrationLog({
      organizationId: input.organizationId,
      proposalId: proposal.id,
      acceptanceId: proposal.acceptance.id,
      action: "REQUEST_IGNORED_DUPLICATE",
      outcome: "SKIPPED",
      message: "Acceptance already exists."
    });

    return {
      ok: true,
      acceptance: mapAcceptance(proposal.acceptance)
    };
  }

  if (input.depositPolicy) {
    const updatedPolicy = await updateProposalDepositPolicyForOrganization({
      organizationId: input.organizationId,
      proposalId: proposal.id,
      depositPolicy: input.depositPolicy
    });

    if (!updatedPolicy) {
      throw new Error("Proposal not found.");
    }
  }

  const acceptance = (await createProposalAcceptanceRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    decisionSource: resolveDecisionSource(input.decisionSource),
    note: input.note,
    metadata: input.metadata
  })) as AcceptanceRecord;

  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: acceptance.id,
    action: "ACCEPTANCE_CREATED",
    outcome: "APPLIED",
    message: "Acceptance record created."
  });

  return {
    ok: true,
    acceptance: mapAcceptance(acceptance)
  };
}

export async function getAcceptanceByProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  const proposal = await getProposalBundle(input);

  if (!proposal.acceptance) {
    throw new Error("Proposal acceptance not found.");
  }

  return {
    ok: true,
    acceptance: mapAcceptance(proposal.acceptance)
  };
}

export async function acceptProposal(input: {
  organizationId: string;
  proposalId: string;
  membershipId?: string | null;
  decisionSource?: string | null;
  note?: string | null;
  metadata?: unknown;
}) {
  const proposal = await getProposalBundle(input);
  const acceptance =
    proposal.acceptance ??
    ((await createProposalAcceptanceRecord({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      decisionSource: resolveDecisionSource(input.decisionSource),
      note: input.note,
      metadata: input.metadata
    })) as AcceptanceRecord);

  if (acceptance.status === "ACCEPTED") {
    await writeProposalOrchestrationLog({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      acceptanceId: acceptance.id,
      action: "REQUEST_IGNORED_DUPLICATE",
      outcome: "SKIPPED",
      message: "Proposal already accepted."
    });

    return {
      ok: true,
      acceptance: mapAcceptance(acceptance)
    };
  }

  if (!canTransitionAcceptanceStatus(acceptance.status, "ACCEPTED")) {
    throw new ProposalOrchestrationConflictError("Invalid proposal acceptance transition.");
  }

  const updated = (await updateProposalAcceptanceRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    status: "ACCEPTED",
    acceptedAt: new Date(),
    acceptedByMembershipId: input.membershipId ?? null,
    decisionSource: resolveDecisionSource(input.decisionSource),
    note: input.note,
    metadata: input.metadata
  })) as AcceptanceRecord | null;

  if (!updated) {
    throw new Error("Proposal acceptance not found.");
  }

  const proposalStatus = await syncProposalStatus({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    nextStatus: "accepted"
  });

  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: updated.id,
    action: "ACCEPTANCE_ACCEPTED",
    outcome: "APPLIED",
    message: "Proposal accepted."
  });
  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: updated.id,
    action: "PROPOSAL_STATUS_SYNCED",
    outcome: proposalStatus.skipped ? "SKIPPED" : "APPLIED",
    message: proposalStatus.skipped ? "Proposal status sync skipped." : "Proposal status synced to accepted."
  });

  return {
    ok: true,
    acceptance: mapAcceptance(updated)
  };
}

export async function rejectProposal(input: {
  organizationId: string;
  proposalId: string;
  membershipId?: string | null;
  decisionSource?: string | null;
  note?: string | null;
  metadata?: unknown;
}) {
  const proposal = await getProposalBundle(input);
  const acceptance =
    proposal.acceptance ??
    ((await createProposalAcceptanceRecord({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      decisionSource: resolveDecisionSource(input.decisionSource),
      note: input.note,
      metadata: input.metadata
    })) as AcceptanceRecord);

  if (acceptance.status === "REJECTED") {
    await writeProposalOrchestrationLog({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      acceptanceId: acceptance.id,
      action: "REQUEST_IGNORED_DUPLICATE",
      outcome: "SKIPPED",
      message: "Proposal already rejected."
    });

    return {
      ok: true,
      acceptance: mapAcceptance(acceptance)
    };
  }

  if (!canTransitionAcceptanceStatus(acceptance.status, "REJECTED")) {
    throw new ProposalOrchestrationConflictError("Invalid proposal acceptance transition.");
  }

  const updated = (await updateProposalAcceptanceRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    status: "REJECTED",
    rejectedAt: new Date(),
    rejectedByMembershipId: input.membershipId ?? null,
    decisionSource: resolveDecisionSource(input.decisionSource),
    note: input.note,
    metadata: input.metadata
  })) as AcceptanceRecord | null;

  if (!updated) {
    throw new Error("Proposal acceptance not found.");
  }

  const proposalStatus = await syncProposalStatus({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    nextStatus: "rejected"
  });

  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: updated.id,
    action: "ACCEPTANCE_REJECTED",
    outcome: "APPLIED",
    message: "Proposal rejected."
  });
  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: updated.id,
    action: "PROPOSAL_STATUS_SYNCED",
    outcome: proposalStatus.skipped ? "SKIPPED" : "APPLIED",
    message: proposalStatus.skipped ? "Proposal status sync skipped." : "Proposal status synced to rejected."
  });

  return {
    ok: true,
    acceptance: mapAcceptance(updated)
  };
}

export async function cancelAcceptance(input: {
  organizationId: string;
  proposalId: string;
  membershipId?: string | null;
  note?: string | null;
  metadata?: unknown;
}) {
  const proposal = await getProposalBundle(input);
  const acceptance = proposal.acceptance;

  if (!acceptance) {
    throw new Error("Proposal acceptance not found.");
  }
  if (!canTransitionAcceptanceStatus(acceptance.status, "CANCELED")) {
    throw new ProposalOrchestrationConflictError("Invalid proposal acceptance transition.");
  }

  const updated = (await updateProposalAcceptanceRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    status: "CANCELED",
    canceledAt: new Date(),
    canceledByMembershipId: input.membershipId ?? null,
    note: input.note,
    metadata: input.metadata
  })) as AcceptanceRecord | null;

  if (!updated) {
    throw new Error("Proposal acceptance not found.");
  }

  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: updated.id,
    action: "ACCEPTANCE_CANCELED",
    outcome: "APPLIED",
    message: "Proposal acceptance canceled."
  });

  return {
    ok: true,
    acceptance: mapAcceptance(updated)
  };
}

async function createOrGetConversionAttempt(input: {
  organizationId: string;
  proposal: OrchestrationBundle;
  membershipId?: string;
  snapshot?: unknown;
}) {
  if (input.proposal.conversion) {
    return input.proposal.conversion;
  }

  return (await createProposalConversionRecord({
    organizationId: input.organizationId,
    proposalId: input.proposal.id,
    leadId: input.proposal.lead?.id ?? null,
    acceptanceId: input.proposal.acceptance?.id ?? null,
    initiatedByMembershipId: input.membershipId ?? null,
    eligibilitySnapshot: input.snapshot
  })) as ConversionRecord;
}

export async function evaluateConversionEligibility(input: {
  organizationId: string;
  proposalId: string;
  membershipId?: string;
}) {
  const proposal = await getProposalBundle(input);
  const eligibility = await evaluateProposalConversionEligibility({
    organizationId: input.organizationId,
    proposal: proposal as any
  });

  const conversion = await createOrGetConversionAttempt({
    organizationId: input.organizationId,
    proposal,
    membershipId: input.membershipId,
    snapshot: eligibility.snapshot
  });

  const nextStatus = eligibility.eligible ? "ELIGIBLE" : "BLOCKED";
  if (!canTransitionConversionStatus(conversion.status, nextStatus)) {
    throw new ProposalOrchestrationConflictError("Invalid conversion status transition.");
  }

  const updated = (await updateProposalConversionRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    status: nextStatus,
    eligibilitySnapshot: eligibility.snapshot,
    blockedReasonCode: eligibility.eligible ? null : eligibility.reasons[0] ?? "unknown_blocker",
    blockedReasonMessage: eligibility.eligible ? null : eligibility.reasons.join(", ")
  })) as ConversionRecord | null;

  if (!updated) {
    throw new Error("Proposal conversion not found.");
  }

  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    conversionId: updated.id,
    action: "ELIGIBILITY_CHECKED",
    outcome: "APPLIED",
    message: eligibility.eligible ? "Conversion eligibility passed." : "Conversion eligibility blocked.",
    details: eligibility.snapshot
  });
  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    conversionId: updated.id,
    action: eligibility.eligible ? "CONVERSION_MARKED_ELIGIBLE" : "CONVERSION_BLOCKED",
    outcome: "APPLIED",
    message: eligibility.eligible ? "Conversion marked eligible." : "Conversion blocked.",
    details: {
      reasons: eligibility.reasons,
      requiredActions: eligibility.requiredActions
    }
  });

  return {
    ok: true,
    eligibility,
    conversion: mapConversion(updated)
  };
}

export async function getConversionByProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  const proposal = await getProposalBundle(input);

  if (!proposal.conversion) {
    throw new Error("Proposal conversion not found.");
  }

  return {
    ok: true,
    conversion: mapConversion(proposal.conversion)
  };
}

export async function convertProposalToProject(input: {
  organizationId: string;
  proposalId: string;
  membershipId: string;
  metadata?: unknown;
}) {
  const evaluation = await evaluateConversionEligibility({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    membershipId: input.membershipId
  });

  if (!evaluation.eligibility.eligible) {
    throw new ProposalOrchestrationConflictError("Proposal conversion is blocked.");
  }

  const proposal = await getProposalBundle(input);
  const conversion = proposal.conversion ?? ((await createOrGetConversionAttempt({
    organizationId: input.organizationId,
    proposal,
    membershipId: input.membershipId,
    snapshot: evaluation.eligibility.snapshot
  })) as ConversionRecord);

  if (conversion.status === "CONVERTED" && conversion.projectId) {
    await writeProposalOrchestrationLog({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      acceptanceId: proposal.acceptance?.id ?? null,
      conversionId: conversion.id,
      action: "REQUEST_IGNORED_DUPLICATE",
      outcome: "SKIPPED",
      message: "Proposal already converted."
    });

    return {
      ok: true,
      eligibility: evaluation.eligibility,
      conversion: mapConversion(conversion)
    };
  }

  const project = await createProjectFromProposal({
    organizationId: input.organizationId,
    proposal
  });

  const updatedConversion = (await updateProposalConversionRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    status: "CONVERTED",
    convertedAt: new Date(),
    projectId: project.id,
    completedByMembershipId: input.membershipId,
    metadata: input.metadata
  })) as ConversionRecord | null;

  if (!updatedConversion) {
    throw new Error("Proposal conversion not found.");
  }

  const proposalStatus = await syncProposalStatus({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    nextStatus: "archived",
    projectId: project.id
  });

  const leadStatus = proposal.lead
    ? await syncLeadWonState({
        organizationId: input.organizationId,
        leadId: proposal.lead.id,
        projectId: project.id
      })
    : { skipped: true, lead: null };

  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    conversionId: updatedConversion.id,
    action: "PROJECT_CREATED",
    outcome: "APPLIED",
    message: `Project ${project.id} created from proposal conversion.`,
    details: {
      projectId: project.id
    }
  });
  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    conversionId: updatedConversion.id,
    action: "PROPOSAL_STATUS_SYNCED",
    outcome: proposalStatus.skipped ? "SKIPPED" : "APPLIED",
    message: proposalStatus.skipped ? "Proposal status sync skipped." : "Proposal status archived after conversion."
  });
  await writeProposalOrchestrationLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    acceptanceId: proposal.acceptance?.id ?? null,
    conversionId: updatedConversion.id,
    action: "LEAD_STATUS_SYNCED",
    outcome: leadStatus.skipped ? "SKIPPED" : "APPLIED",
    message: leadStatus.skipped ? "Lead status sync skipped." : "Lead status synced to won."
  });

  return {
    ok: true,
    eligibility: evaluation.eligibility,
    conversion: mapConversion(updatedConversion),
    project: {
      id: project.id,
      name: project.name
    }
  };
}

export async function listOrchestrationLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  await getProposalBundle(input);
  const logs = (await listProposalOrchestrationLogs(input)) as LogRecord[];

  return {
    ok: true,
    logs: logs.map(mapLog)
  };
}

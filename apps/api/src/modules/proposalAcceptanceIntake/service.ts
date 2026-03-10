import type {
  ProposalAcceptanceEvidenceView,
  ProposalAcceptanceIntakeLogView,
  ProposalAcceptanceIntakeView,
  ProposalAcceptanceVerificationView
} from "./contracts.js";
import { writeProposalAcceptanceIntakeLog } from "./audit.js";
import { handoffToProposalOrchestrator } from "./handoff.js";
import { getAcceptanceProviderAdapter } from "./providerAdapter.js";
import {
  createProposalAcceptanceEvidenceRecords,
  createProposalAcceptanceIntakeRecord,
  getProposalAcceptanceIntakeById,
  getProposalAcceptanceIntakeByProviderReference,
  getProposalAcceptanceIntakeByTokenHash,
  getProposalForAcceptanceIntakeLookup,
  getProposalForAcceptanceIntakeOrganization,
  listProposalAcceptanceEvidenceForIntake,
  listProposalAcceptanceIntakeLogsForProposal,
  listProposalAcceptanceIntakesForProposal,
  updateProposalAcceptanceIntakeRecord
} from "./repository.js";
import {
  canTransitionIntakeStatus,
  isTerminalIntakeStatus
} from "./statusAdapter.js";
import { generateAcceptanceToken, hashAcceptanceToken } from "./token.js";
import { verifyAcceptanceIntakeSubmission } from "./verification.js";

type IntakeRecord = {
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
  createdAt: Date;
  updatedAt: Date;
};

type EvidenceRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  intakeId: string;
  kind: string;
  value: string | null;
  details: unknown;
  createdAt: Date;
};

type IntakeLogRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  intakeId: string | null;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: Date;
};

type ProposalRecord = {
  id: string;
  organizationId: string;
  status: string | null;
  publicToken: string | null;
  project: { id: string } | null;
  acceptance: { id: string; status: string } | null;
  conversion: { id: string; status: string; projectId: string | null } | null;
};

type TokenLookupRecord = IntakeRecord & {
  proposal: ProposalRecord;
};

export class ProposalAcceptanceIntakeConflictError extends Error {}
export class ProposalAcceptancePublicTokenError extends Error {}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function mapIntake(record: IntakeRecord): ProposalAcceptanceIntakeView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    status: record.status,
    source: record.source,
    tokenExpiresAt: toIso(record.tokenExpiresAt),
    openedAt: toIso(record.openedAt),
    submittedAt: toIso(record.submittedAt),
    verifiedAt: toIso(record.verifiedAt),
    handedOffAt: toIso(record.handedOffAt),
    expiredAt: toIso(record.expiredAt),
    revokedAt: toIso(record.revokedAt),
    failedAt: toIso(record.failedAt),
    externalIdentityName: record.externalIdentityName,
    externalIdentityEmail: record.externalIdentityEmail,
    externalIp: record.externalIp,
    externalUserAgent: record.externalUserAgent,
    provider: record.provider,
    providerReference: record.providerReference,
    note: record.note,
    payload: record.payload,
    verificationSnapshot: record.verificationSnapshot,
    metadata: record.metadata,
    createdByMembershipId: record.createdByMembershipId,
    updatedByMembershipId: record.updatedByMembershipId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapEvidence(record: EvidenceRecord): ProposalAcceptanceEvidenceView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    intakeId: record.intakeId,
    kind: record.kind,
    value: record.value,
    details: record.details,
    createdAt: record.createdAt.toISOString()
  };
}

function mapLog(record: IntakeLogRecord): ProposalAcceptanceIntakeLogView {
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

async function ensureProposalOwnership(input: { organizationId: string; proposalId: string }) {
  const proposal = (await getProposalForAcceptanceIntakeOrganization(input)) as ProposalRecord | null;

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return proposal;
}

async function ensureIntakeOwnership(input: { organizationId: string; intakeId: string }) {
  const intake = (await getProposalAcceptanceIntakeById(input)) as IntakeRecord | null;

  if (!intake) {
    throw new Error("Proposal acceptance intake not found.");
  }

  return intake;
}

async function markExpiredIfNeeded(intake: IntakeRecord) {
  if (
    intake.status === "OPEN" &&
    intake.tokenExpiresAt &&
    intake.tokenExpiresAt.getTime() < Date.now()
  ) {
    return updateProposalAcceptanceIntakeRecord({
      organizationId: intake.organizationId,
      intakeId: intake.id,
      status: "EXPIRED",
      expiredAt: new Date()
    });
  }

  return intake;
}

function buildEvidenceEntries(input: {
  intake: IntakeRecord;
  confirmed: boolean;
  signerName?: string | null;
  signerEmail?: string | null;
  note?: string | null;
  externalIp?: string | null;
  externalUserAgent?: string | null;
  providerReference?: string | null;
  verification: ProposalAcceptanceVerificationView;
}) {
  const entries: Array<{
    kind:
      | "CHECKBOX_CONFIRMATION"
      | "TYPED_NAME"
      | "EMAIL_MATCH"
      | "PROVIDER_ASSERTION"
      | "IP_CAPTURE"
      | "USER_AGENT_CAPTURE"
      | "NOTE";
    value?: string | null;
    details?: unknown;
  }> = [];

  if (input.confirmed) {
    entries.push({ kind: "CHECKBOX_CONFIRMATION", value: "true" });
  }
  if (input.signerName?.trim()) {
    entries.push({ kind: "TYPED_NAME", value: input.signerName.trim() });
  }
  if (input.signerEmail?.trim()) {
    entries.push({ kind: "EMAIL_MATCH", value: input.signerEmail.trim().toLowerCase() });
  }
  if (input.providerReference?.trim()) {
    entries.push({ kind: "PROVIDER_ASSERTION", value: input.providerReference.trim() });
  }
  if (input.externalIp?.trim()) {
    entries.push({ kind: "IP_CAPTURE", value: input.externalIp.trim() });
  }
  if (input.externalUserAgent?.trim()) {
    entries.push({ kind: "USER_AGENT_CAPTURE", value: input.externalUserAgent.trim() });
  }
  if (input.note?.trim()) {
    entries.push({ kind: "NOTE", value: input.note.trim() });
  }

  if (entries.length === 0) {
    entries.push({
      kind: "NOTE",
      value: null,
      details: {
        reason: "no_evidence_captured",
        verification: input.verification
      }
    });
  }

  return entries;
}

async function validateTokenRecord(token: string) {
  const lookup = (await getProposalAcceptanceIntakeByTokenHash({
    tokenHash: hashAcceptanceToken(token)
  })) as TokenLookupRecord | null;

  if (!lookup) {
    throw new ProposalAcceptancePublicTokenError("Invalid or expired acceptance token.");
  }

  const maybeExpired = (await markExpiredIfNeeded(lookup)) as IntakeRecord;

  if (maybeExpired.status === "EXPIRED" || maybeExpired.status === "REVOKED") {
    await writeProposalAcceptanceIntakeLog({
      organizationId: maybeExpired.organizationId,
      proposalId: maybeExpired.proposalId,
      intakeId: maybeExpired.id,
      action: "TOKEN_REJECTED",
      outcome: "FAILED",
      message: "Acceptance token was expired or revoked."
    });
    throw new ProposalAcceptancePublicTokenError("Invalid or expired acceptance token.");
  }

  return {
    intake: maybeExpired,
    proposal: lookup.proposal
  };
}

async function processVerifiedSubmission(input: {
  intake: IntakeRecord;
  proposal: ProposalRecord;
  confirmed: boolean;
  signerName?: string | null;
  signerEmail?: string | null;
  note?: string | null;
  metadata?: unknown;
  externalIp?: string | null;
  externalUserAgent?: string | null;
  providerReference?: string | null;
  actorMembershipId?: string | null;
}) {
  if (input.intake.status === "HANDOFF_ACCEPTED") {
    await writeProposalAcceptanceIntakeLog({
      organizationId: input.intake.organizationId,
      proposalId: input.intake.proposalId,
      intakeId: input.intake.id,
      action: "REQUEST_IGNORED_DUPLICATE",
      outcome: "SKIPPED",
      message: "Acceptance intake already handed off successfully."
    });

    return {
      ok: true,
      intake: mapIntake(input.intake),
      verification: {
        verified: true,
        reasons: [],
        normalizedDecisionSource:
          input.intake.source === "PROVIDER_CALLBACK" ? "PROVIDER_CONFIRMED" : "MANUAL_EXTERNAL",
        evidenceSummary: [],
        handoffAllowed: true
      } satisfies ProposalAcceptanceVerificationView,
      handoff: { status: "HANDOFF_ACCEPTED" as const }
    };
  }

  if (isTerminalIntakeStatus(input.intake.status) && input.intake.status !== "OPEN") {
    throw new ProposalAcceptancePublicTokenError("Invalid or expired acceptance token.");
  }

  if (!canTransitionIntakeStatus(input.intake.status, "SUBMITTED")) {
    throw new ProposalAcceptanceIntakeConflictError("Invalid intake submission transition.");
  }

  const submitted = (await updateProposalAcceptanceIntakeRecord({
    organizationId: input.intake.organizationId,
    intakeId: input.intake.id,
    status: "SUBMITTED",
    submittedAt: new Date(),
    externalIdentityName: input.signerName ?? input.intake.externalIdentityName,
    externalIdentityEmail: input.signerEmail ?? input.intake.externalIdentityEmail,
    externalIp: input.externalIp ?? input.intake.externalIp,
    externalUserAgent: input.externalUserAgent ?? input.intake.externalUserAgent,
    providerReference: input.providerReference ?? input.intake.providerReference,
    note: input.note ?? input.intake.note,
    payload: {
      confirmed: input.confirmed,
      signerName: input.signerName ?? null,
      signerEmail: input.signerEmail ?? null,
      note: input.note ?? null
    },
    metadata: input.metadata,
    updatedByMembershipId: input.actorMembershipId ?? null
  })) as IntakeRecord | null;

  if (!submitted) {
    throw new Error("Proposal acceptance intake not found.");
  }

  await writeProposalAcceptanceIntakeLog({
    organizationId: submitted.organizationId,
    proposalId: submitted.proposalId,
    intakeId: submitted.id,
    action: "SUBMISSION_RECEIVED",
    outcome: "APPLIED",
    message: "Acceptance submission received."
  });

  const verification = verifyAcceptanceIntakeSubmission({
    proposal: input.proposal,
    intake: submitted,
    confirmed: input.confirmed,
    signerName: input.signerName,
    signerEmail: input.signerEmail,
    externalIp: input.externalIp,
    externalUserAgent: input.externalUserAgent,
    providerReference: input.providerReference
  });

  await createProposalAcceptanceEvidenceRecords({
    organizationId: submitted.organizationId,
    proposalId: submitted.proposalId,
    intakeId: submitted.id,
    entries: buildEvidenceEntries({
      intake: submitted,
      confirmed: input.confirmed,
      signerName: input.signerName,
      signerEmail: input.signerEmail,
      note: input.note,
      externalIp: input.externalIp,
      externalUserAgent: input.externalUserAgent,
      providerReference: input.providerReference,
      verification
    })
  });

  if (!verification.verified) {
    const failed = (await updateProposalAcceptanceIntakeRecord({
      organizationId: submitted.organizationId,
      intakeId: submitted.id,
      status: "FAILED",
      failedAt: new Date(),
      verificationSnapshot: verification,
      updatedByMembershipId: input.actorMembershipId ?? null
    })) as IntakeRecord | null;

    await writeProposalAcceptanceIntakeLog({
      organizationId: submitted.organizationId,
      proposalId: submitted.proposalId,
      intakeId: submitted.id,
      action: "SUBMISSION_FAILED",
      outcome: "FAILED",
      message: "Acceptance submission verification failed.",
      details: verification
    });

    return {
      ok: false,
      intake: mapIntake((failed ?? submitted) as IntakeRecord),
      verification,
      handoff: {
        status: "FAILED" as const
      }
    };
  }

  const verified = (await updateProposalAcceptanceIntakeRecord({
    organizationId: submitted.organizationId,
    intakeId: submitted.id,
    status: "VERIFIED",
    verifiedAt: new Date(),
    verificationSnapshot: verification,
    updatedByMembershipId: input.actorMembershipId ?? null
  })) as IntakeRecord | null;

  if (!verified) {
    throw new Error("Proposal acceptance intake not found.");
  }

  await writeProposalAcceptanceIntakeLog({
    organizationId: verified.organizationId,
    proposalId: verified.proposalId,
    intakeId: verified.id,
    action: "SUBMISSION_VERIFIED",
    outcome: "APPLIED",
    message: "Acceptance submission verified.",
    details: verification
  });
  await writeProposalAcceptanceIntakeLog({
    organizationId: verified.organizationId,
    proposalId: verified.proposalId,
    intakeId: verified.id,
    action: "HANDOFF_REQUESTED",
    outcome: "APPLIED",
    message: "Acceptance handoff requested."
  });

  const handoff = await handoffToProposalOrchestrator({
    organizationId: verified.organizationId,
    proposalId: verified.proposalId,
    actorMembershipId: input.actorMembershipId ?? verified.createdByMembershipId ?? null,
    decisionSource: verification.normalizedDecisionSource,
    note: input.note,
    metadata: {
      intakeId: verified.id,
      intakeSource: verified.source,
      ...(typeof input.metadata === "object" && input.metadata !== null ? (input.metadata as Record<string, unknown>) : {})
    }
  });

  if (!handoff.accepted) {
    const rejected = (await updateProposalAcceptanceIntakeRecord({
      organizationId: verified.organizationId,
      intakeId: verified.id,
      status: "HANDOFF_REJECTED",
      handedOffAt: new Date(),
      verificationSnapshot: {
        verification,
        handoff
      },
      updatedByMembershipId: input.actorMembershipId ?? null
    })) as IntakeRecord | null;

    await writeProposalAcceptanceIntakeLog({
      organizationId: verified.organizationId,
      proposalId: verified.proposalId,
      intakeId: verified.id,
      action: "HANDOFF_REJECTED",
      outcome: "FAILED",
      message: handoff.reason ?? "Acceptance handoff rejected.",
      details: handoff
    });

    return {
      ok: false,
      intake: mapIntake((rejected ?? verified) as IntakeRecord),
      verification,
      handoff: {
        status: "HANDOFF_REJECTED" as const,
        reason: handoff.reason ?? "Acceptance handoff rejected."
      }
    };
  }

  const accepted = (await updateProposalAcceptanceIntakeRecord({
    organizationId: verified.organizationId,
    intakeId: verified.id,
    status: "HANDOFF_ACCEPTED",
    handedOffAt: new Date(),
    verificationSnapshot: {
      verification,
      handoff
    },
    updatedByMembershipId: input.actorMembershipId ?? null
  })) as IntakeRecord | null;

  await writeProposalAcceptanceIntakeLog({
    organizationId: verified.organizationId,
    proposalId: verified.proposalId,
    intakeId: verified.id,
    action: "HANDOFF_ACCEPTED",
    outcome: handoff.skipped ? "SKIPPED" : "APPLIED",
    message: handoff.skipped
      ? "Acceptance handoff completed with existing accepted state."
      : "Acceptance handoff completed."
  });

  return {
    ok: true,
    intake: mapIntake((accepted ?? verified) as IntakeRecord),
    verification,
    handoff: {
      status: "HANDOFF_ACCEPTED" as const,
      skipped: handoff.skipped ?? false,
      acceptance: handoff.acceptance
    }
  };
}

export async function createIntakeSession(input: {
  organizationId: string;
  proposalId: string;
  actorMembershipId: string;
  source?: "PUBLIC_TOKEN" | "PROVIDER_CALLBACK" | "EXTERNAL_MANUAL_ENTRY";
  tokenTtlHours?: number;
  provider?: string;
  providerReference?: string | null;
  note?: string | null;
  metadata?: unknown;
  confirmed?: boolean;
  signerName?: string | null;
  signerEmail?: string | null;
}) {
  const proposal = await ensureProposalOwnership({
    organizationId: input.organizationId,
    proposalId: input.proposalId
  });
  const source = input.source ?? "PUBLIC_TOKEN";

  if (source === "PROVIDER_CALLBACK" && input.provider && input.providerReference) {
    const existing = (await getProposalAcceptanceIntakeByProviderReference({
      organizationId: input.organizationId,
      provider: input.provider.trim().toUpperCase() as "STRIPE",
      providerReference: input.providerReference,
      proposalId: input.proposalId
    })) as IntakeRecord | null;

    if (existing) {
      await writeProposalAcceptanceIntakeLog({
        organizationId: existing.organizationId,
        proposalId: existing.proposalId,
        intakeId: existing.id,
        action: "REQUEST_IGNORED_DUPLICATE",
        outcome: "SKIPPED",
        message: "Provider acceptance intake already exists."
      });

      return {
        ok: true,
        intake: mapIntake(existing)
      };
    }
  }

  const publicToken = source === "PUBLIC_TOKEN" ? generateAcceptanceToken() : null;
  const tokenExpiresAt =
    source === "PUBLIC_TOKEN"
      ? new Date(Date.now() + (input.tokenTtlHours ?? 24 * 7) * 60 * 60 * 1000)
      : null;

  const intake = (await createProposalAcceptanceIntakeRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    source,
    status: "OPEN",
    tokenHash: publicToken ? hashAcceptanceToken(publicToken) : null,
    tokenExpiresAt,
    openedAt: new Date(),
    provider: input.provider ? (input.provider.trim().toUpperCase() as "STRIPE") : null,
    providerReference: input.providerReference ?? null,
    note: input.note,
    metadata: input.metadata,
    createdByMembershipId: input.actorMembershipId,
    updatedByMembershipId: input.actorMembershipId
  })) as IntakeRecord;

  await writeProposalAcceptanceIntakeLog({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    intakeId: intake.id,
    action: "INTAKE_CREATED",
    outcome: "APPLIED",
    message: "Acceptance intake session created."
  });

  if (publicToken) {
    await writeProposalAcceptanceIntakeLog({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      intakeId: intake.id,
      action: "TOKEN_ISSUED",
      outcome: "APPLIED",
      message: "Acceptance token issued."
    });
  }

  if (source === "EXTERNAL_MANUAL_ENTRY" && input.confirmed) {
    return processVerifiedSubmission({
      intake,
      proposal,
      confirmed: input.confirmed,
      signerName: input.signerName,
      signerEmail: input.signerEmail,
      note: input.note,
      metadata: input.metadata,
      actorMembershipId: input.actorMembershipId
    });
  }

  return {
    ok: true,
    intake: mapIntake(intake),
    publicToken,
    publicTokenExpiresAt: toIso(tokenExpiresAt)
  };
}

export async function revokeIntakeSession(input: {
  organizationId: string;
  intakeId: string;
  actorMembershipId: string;
  note?: string | null;
}) {
  const intake = await ensureIntakeOwnership(input);

  if (isTerminalIntakeStatus(intake.status) && intake.status !== "OPEN") {
    throw new ProposalAcceptanceIntakeConflictError("Proposal acceptance intake cannot be revoked.");
  }
  if (!canTransitionIntakeStatus(intake.status, "REVOKED")) {
    throw new ProposalAcceptanceIntakeConflictError("Invalid acceptance intake transition.");
  }

  const updated = (await updateProposalAcceptanceIntakeRecord({
    organizationId: input.organizationId,
    intakeId: input.intakeId,
    status: "REVOKED",
    revokedAt: new Date(),
    note: input.note ?? intake.note,
    updatedByMembershipId: input.actorMembershipId
  })) as IntakeRecord | null;

  if (!updated) {
    throw new Error("Proposal acceptance intake not found.");
  }

  await writeProposalAcceptanceIntakeLog({
    organizationId: updated.organizationId,
    proposalId: updated.proposalId,
    intakeId: updated.id,
    action: "INTAKE_REVOKED",
    outcome: "APPLIED",
    message: "Acceptance intake revoked."
  });

  return {
    ok: true,
    intake: mapIntake(updated)
  };
}

export async function expireStaleIntakeSession(input: {
  organizationId: string;
  intakeId: string;
}) {
  const intake = await ensureIntakeOwnership(input);

  if (!intake.tokenExpiresAt || intake.tokenExpiresAt.getTime() >= Date.now()) {
    return {
      ok: true,
      expired: false,
      intake: mapIntake(intake)
    };
  }

  if (!canTransitionIntakeStatus(intake.status, "EXPIRED")) {
    return {
      ok: true,
      expired: false,
      intake: mapIntake(intake)
    };
  }

  const updated = (await updateProposalAcceptanceIntakeRecord({
    organizationId: intake.organizationId,
    intakeId: intake.id,
    status: "EXPIRED",
    expiredAt: new Date()
  })) as IntakeRecord | null;

  await writeProposalAcceptanceIntakeLog({
    organizationId: intake.organizationId,
    proposalId: intake.proposalId,
    intakeId: intake.id,
    action: "INTAKE_EXPIRED",
    outcome: "APPLIED",
    message: "Acceptance intake expired."
  });

  return {
    ok: true,
    expired: true,
    intake: mapIntake((updated ?? intake) as IntakeRecord)
  };
}

export async function getIntakeById(input: {
  organizationId: string;
  intakeId: string;
}) {
  const intake = await ensureIntakeOwnership(input);

  return {
    ok: true,
    intake: mapIntake(intake)
  };
}

export async function listIntakesForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  await ensureProposalOwnership(input);
  const intakes = (await listProposalAcceptanceIntakesForProposal(input)) as IntakeRecord[];

  return {
    ok: true,
    intakes: intakes.map(mapIntake)
  };
}

export async function validatePublicToken(input: {
  token: string;
}) {
  const { intake } = await validateTokenRecord(input.token);

  await writeProposalAcceptanceIntakeLog({
    organizationId: intake.organizationId,
    proposalId: intake.proposalId,
    intakeId: intake.id,
    action: "TOKEN_VALIDATED",
    outcome: "APPLIED",
    message: "Acceptance token validated."
  });

  return {
    ok: true,
    valid: true,
    intake: mapIntake(intake)
  };
}

export async function submitExternalAcceptance(input: {
  token: string;
  confirmed: boolean;
  signerName: string;
  signerEmail?: string | null;
  note?: string | null;
  metadata?: unknown;
  externalIp?: string | null;
  externalUserAgent?: string | null;
}) {
  const { intake, proposal } = await validateTokenRecord(input.token);

  return processVerifiedSubmission({
    intake,
    proposal,
    confirmed: input.confirmed,
    signerName: input.signerName,
    signerEmail: input.signerEmail,
    note: input.note,
    metadata: input.metadata,
    externalIp: input.externalIp,
    externalUserAgent: input.externalUserAgent
  });
}

export async function verifyIntakeSubmission(input: {
  organizationId: string;
  intakeId: string;
  confirmed: boolean;
  signerName?: string | null;
  signerEmail?: string | null;
  externalIp?: string | null;
  externalUserAgent?: string | null;
  providerReference?: string | null;
}) {
  const intake = await ensureIntakeOwnership({
    organizationId: input.organizationId,
    intakeId: input.intakeId
  });
  const proposal = await ensureProposalOwnership({
    organizationId: intake.organizationId,
    proposalId: intake.proposalId
  });

  const verification = verifyAcceptanceIntakeSubmission({
    proposal,
    intake,
    confirmed: input.confirmed,
    signerName: input.signerName,
    signerEmail: input.signerEmail,
    externalIp: input.externalIp,
    externalUserAgent: input.externalUserAgent,
    providerReference: input.providerReference
  });

  return {
    ok: true,
    verification
  };
}

export async function ingestProviderAcceptanceSignal(input: {
  provider: string;
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
}) {
  const adapter = getAcceptanceProviderAdapter(input.provider);
  const normalized = await adapter.normalizeSignal({
    payload: input.payload,
    headers: input.headers
  });

  let proposal: ProposalRecord | null = null;
  let existing: IntakeRecord | null = null;

  if (normalized.intakeId) {
    const intakeById = (await getProposalAcceptanceIntakeById({
      organizationId: "",
      intakeId: normalized.intakeId
    })) as IntakeRecord | null;

    if (intakeById) {
      existing = intakeById;
      proposal = (await getProposalForAcceptanceIntakeOrganization({
        organizationId: intakeById.organizationId,
        proposalId: intakeById.proposalId
      })) as ProposalRecord | null;
    }
  }

  if (!proposal && normalized.proposalLookup) {
    proposal = (await getProposalForAcceptanceIntakeLookup({
      proposalLookup: normalized.proposalLookup
    })) as ProposalRecord | null;
  }

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  if (!existing && normalized.providerReference) {
    existing = (await getProposalAcceptanceIntakeByProviderReference({
      organizationId: proposal.organizationId,
      provider: normalized.provider as "STRIPE",
      providerReference: normalized.providerReference,
      proposalId: proposal.id
    })) as IntakeRecord | null;
  }

  if (!existing) {
    existing = (await createProposalAcceptanceIntakeRecord({
      organizationId: proposal.organizationId,
      proposalId: proposal.id,
      source: "PROVIDER_CALLBACK",
      status: "OPEN",
      provider: normalized.provider as "STRIPE",
      providerReference: normalized.providerReference,
      openedAt: new Date(),
      payload: normalized.payload,
      metadata: normalized.metadata
    })) as IntakeRecord;

    await writeProposalAcceptanceIntakeLog({
      organizationId: existing.organizationId,
      proposalId: existing.proposalId,
      intakeId: existing.id,
      action: "INTAKE_CREATED",
      outcome: "APPLIED",
      message: "Provider acceptance intake created."
    });
  } else if (existing.status === "HANDOFF_ACCEPTED") {
    await writeProposalAcceptanceIntakeLog({
      organizationId: existing.organizationId,
      proposalId: existing.proposalId,
      intakeId: existing.id,
      action: "REQUEST_IGNORED_DUPLICATE",
      outcome: "SKIPPED",
      message: "Provider acceptance signal already processed."
    });

    return {
      ok: true,
      intake: mapIntake(existing)
    };
  }

  return processVerifiedSubmission({
    intake: existing,
    proposal,
    confirmed: normalized.confirmed,
    signerName: normalized.signerName ?? null,
    signerEmail: normalized.signerEmail ?? null,
    note: normalized.note ?? null,
    metadata: normalized.metadata,
    providerReference: normalized.providerReference,
    externalUserAgent:
      typeof input.headers["user-agent"] === "string"
        ? input.headers["user-agent"]
        : Array.isArray(input.headers["user-agent"])
          ? input.headers["user-agent"][0] ?? null
          : null
  });
}

export async function handoffIntakeToProposalOrchestrator(input: {
  organizationId: string;
  intakeId: string;
  actorMembershipId?: string | null;
}) {
  const intake = await ensureIntakeOwnership({
    organizationId: input.organizationId,
    intakeId: input.intakeId
  });
  const proposal = await ensureProposalOwnership({
    organizationId: intake.organizationId,
    proposalId: intake.proposalId
  });

  return processVerifiedSubmission({
    intake,
    proposal,
    confirmed: true,
    signerName: intake.externalIdentityName,
    signerEmail: intake.externalIdentityEmail,
    note: intake.note,
    metadata: intake.metadata,
    externalIp: intake.externalIp,
    externalUserAgent: intake.externalUserAgent,
    providerReference: intake.providerReference,
    actorMembershipId: input.actorMembershipId ?? intake.updatedByMembershipId ?? intake.createdByMembershipId
  });
}

export async function listIntakeLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  await ensureProposalOwnership(input);
  const logs = (await listProposalAcceptanceIntakeLogsForProposal(input)) as IntakeLogRecord[];

  return {
    ok: true,
    logs: logs.map(mapLog)
  };
}

export async function listEvidenceForIntake(input: {
  organizationId: string;
  intakeId: string;
}) {
  await ensureIntakeOwnership(input);
  const evidence = (await listProposalAcceptanceEvidenceForIntake(input)) as EvidenceRecord[];

  return {
    ok: true,
    evidence: evidence.map(mapEvidence)
  };
}

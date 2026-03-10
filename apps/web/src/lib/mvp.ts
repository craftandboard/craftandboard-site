import { appUrl } from "./site-config";

export function formatCurrency(cents: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format((cents ?? 0) / 100);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

export function humanizeToken(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function parseCurrencyInputToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100);
}

export function centsToInputValue(cents: number | null | undefined) {
  return ((cents ?? 0) / 100).toFixed(2);
}

export function buildAcceptanceReviewUrl(publicToken: string) {
  return appUrl(`/accept/proposal?token=${encodeURIComponent(publicToken)}`);
}

export function toneForStatus(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (
    normalized.includes("paid") ||
    normalized.includes("accepted") ||
    normalized.includes("converted") ||
    normalized.includes("won") ||
    normalized.includes("success")
  ) {
    return "success";
  }

  if (
    normalized.includes("blocked") ||
    normalized.includes("failed") ||
    normalized.includes("rejected") ||
    normalized.includes("void") ||
    normalized.includes("canceled") ||
    normalized.includes("expired") ||
    normalized.includes("error")
  ) {
    return "danger";
  }

  if (
    normalized.includes("requested") ||
    normalized.includes("pending") ||
    normalized.includes("submitted") ||
    normalized.includes("verified") ||
    normalized.includes("review")
  ) {
    return "warning";
  }

  return "neutral";
}

export function getIntakeStatusLabel(value: string | null | undefined) {
  switch ((value ?? "").toUpperCase()) {
    case "OPEN":
      return "Active link ready to share";
    case "SUBMITTED":
      return "Confirmation already received";
    case "VERIFIED":
      return "Verified";
    case "HANDOFF_ACCEPTED":
      return "Acceptance completed";
    case "HANDOFF_REJECTED":
      return "Needs internal review";
    case "EXPIRED":
      return "Link expired";
    case "REVOKED":
      return "Link revoked";
    case "FAILED":
      return "Needs a new link";
    default:
      return humanizeToken(value);
  }
}

export function getPublicAcceptanceStateLabel(value: string | null | undefined) {
  switch ((value ?? "").toUpperCase()) {
    case "READY":
      return "Ready for review";
    case "REVIEW_READY":
      return "Ready for review";
    case "INSTRUCTIONS_READY":
      return "Instructions ready";
    case "READY_TO_CONFIRM":
      return "Ready to confirm";
    case "SUBMITTED":
      return "Confirmation already received";
    case "CONFIRMED":
    case "COMPLETED":
      return "Acceptance completed";
    case "REVOKED":
      return "Link revoked";
    case "INVALID":
      return "Invalid link";
    case "BLOCKED":
      return "Review blocked";
    case "EXPIRED":
      return "Link expired";
    default:
      return humanizeToken(value);
  }
}

export function getConversionStatusLabel(value: string | null | undefined) {
  switch ((value ?? "").toUpperCase()) {
    case "ELIGIBLE":
      return "Ready to convert";
    case "BLOCKED":
      return "Conversion blocked";
    case "CONVERTED":
      return "Project created";
    default:
      return humanizeToken(value);
  }
}

export function isAcceptanceCompleted(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();
  return normalized === "ACCEPTED" || normalized === "HANDOFF_ACCEPTED";
}

export function needsNewAcceptanceLink(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();
  return (
    normalized === "" ||
    normalized === "EXPIRED" ||
    normalized === "REVOKED" ||
    normalized === "FAILED" ||
    normalized === "SUBMITTED" ||
    normalized === "HANDOFF_ACCEPTED" ||
    normalized === "HANDOFF_REJECTED"
  );
}

export function getPilotWorkflowStatusLabel(input: {
  hasProposal: boolean;
  hasActiveLink: boolean;
  linkNeedsReissue: boolean;
  acceptanceCompleted: boolean;
  depositRequired: boolean;
  depositOutstandingAmountCents: number;
  conversionStatus?: string | null;
  projectCreated: boolean;
  blockerCount: number;
}) {
  if (input.blockerCount > 0) {
    return "Blocked by pilot issue";
  }
  if (!input.hasProposal) {
    return "Waiting on proposal";
  }
  if (input.projectCreated || (input.conversionStatus ?? "").toUpperCase() === "CONVERTED") {
    return "Project created";
  }
  if (!input.acceptanceCompleted) {
    if (input.linkNeedsReissue) {
      return "Needs new acceptance link";
    }
    if (input.hasActiveLink) {
      return "Waiting on customer acceptance";
    }
    return "Waiting on customer acceptance";
  }
  if (input.depositRequired && input.depositOutstandingAmountCents > 0) {
    return "Waiting on deposit";
  }
  if ((input.conversionStatus ?? "").toUpperCase() === "ELIGIBLE") {
    return "Ready to convert";
  }
  if ((input.conversionStatus ?? "").toUpperCase() === "BLOCKED") {
    return "Conversion blocked";
  }
  return "Ready for next action";
}

export function getPilotNextActionLabel(input: {
  hasProposal: boolean;
  hasActiveLink: boolean;
  linkNeedsReissue: boolean;
  acceptanceCompleted: boolean;
  depositRequired: boolean;
  depositRequestedAmountCents: number;
  depositOutstandingAmountCents: number;
  conversionStatus?: string | null;
  projectCreated: boolean;
  blockerCount: number;
}) {
  if (input.blockerCount > 0) {
    return "Review blocker issue";
  }
  if (!input.hasProposal) {
    return "Create proposal";
  }
  if (!input.acceptanceCompleted) {
    if (input.linkNeedsReissue || !input.hasActiveLink) {
      return "Issue fresh acceptance link";
    }
    return "Wait for customer acceptance";
  }
  if (input.depositRequired && input.depositRequestedAmountCents <= 0) {
    return "Request deposit";
  }
  if (input.depositRequired && input.depositOutstandingAmountCents > 0) {
    return "Wait for deposit";
  }
  if (input.projectCreated || (input.conversionStatus ?? "").toUpperCase() === "CONVERTED") {
    return "Project ready";
  }
  if ((input.conversionStatus ?? "").toUpperCase() === "ELIGIBLE") {
    return "Convert to project";
  }
  return "Evaluate conversion";
}

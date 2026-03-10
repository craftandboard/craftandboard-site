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

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_MARKETING_URL = "http://localhost:3000";
const DEFAULT_API_BASE_URL = "http://localhost:4000";

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function ensureLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export const APP_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? DEFAULT_APP_URL
);

export const MARKETING_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_MARKETING_URL ??
    process.env.MARKETING_URL ??
    DEFAULT_MARKETING_URL
);

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    DEFAULT_API_BASE_URL
);

export function joinUrl(baseUrl: string, path = "/") {
  const base = trimTrailingSlash(baseUrl);
  const safePath = path ? ensureLeadingSlash(path) : "/";
  return `${base}${safePath}`;
}

export function appUrl(path = "/") {
  return joinUrl(APP_URL, path);
}

export function marketingUrl(path = "/") {
  return joinUrl(MARKETING_URL, path);
}

export function apiUrl(path = "/") {
  return joinUrl(API_BASE_URL, path);
}

export function normalizeHostname(host: string | null | undefined) {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

export function isMarketingHostname(host: string | null | undefined) {
  const normalized = normalizeHostname(host);
  const configuredMarketingHost = hostnameFromUrl(MARKETING_URL);
  const configuredAppHost = hostnameFromUrl(APP_URL);

  if (!normalized) {
    return false;
  }

  if (configuredMarketingHost && configuredMarketingHost !== configuredAppHost) {
    return normalized === configuredMarketingHost;
  }

  return normalized === "fieldmetriq.com" || normalized === "www.fieldmetriq.com";
}

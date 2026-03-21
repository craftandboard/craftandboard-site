const SEO_ATTRIBUTION_STORAGE_KEY = "cb_seo_landing_attribution_v1";

export type SeoLandingAttribution = {
  landingPath: string;
  firstSeenAt: string;
  trafficSource?: string | null;
};

function normalizePath(pathname: string) {
  const path = pathname.split(/[?#]/)[0] ?? "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.replace(/\/+$/, "") || "/";
}

export function isSeoLandingPath(pathname: string) {
  const normalized = normalizePath(pathname);

  if (
    normalized.startsWith("/admin") ||
    normalized.startsWith("/api") ||
    normalized.startsWith("/order") ||
    normalized.startsWith("/proposal") ||
    normalized.startsWith("/deposit")
  ) {
    return false;
  }

  if (["/", "/shop", "/guides", "/faq", "/gallery", "/about"].includes(normalized)) {
    return true;
  }

  return [
    "/guides/",
    "/shop/floating-shelves",
    "/shop/floating-mantels",
    "/floating-shelves/",
    "/floating-mantels/"
  ].some((prefix) => normalized.startsWith(prefix));
}

export function getStoredSeoLandingAttribution(): SeoLandingAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SEO_ATTRIBUTION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SeoLandingAttribution>;

    if (!parsed.landingPath || !parsed.firstSeenAt) {
      return null;
    }

    return {
      landingPath: normalizePath(parsed.landingPath),
      firstSeenAt: parsed.firstSeenAt,
      trafficSource: typeof parsed.trafficSource === "string" ? parsed.trafficSource : null
    };
  } catch {
    return null;
  }
}

function normalizeTrafficSource(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function captureSeoLandingAttribution(pathname: string, search = "") {
  if (typeof window === "undefined") {
    return;
  }

  if (!isSeoLandingPath(pathname)) {
    return;
  }

  const current = getStoredSeoLandingAttribution();

  if (current?.landingPath) {
    return;
  }

  const value: SeoLandingAttribution = {
    landingPath: normalizePath(pathname),
    firstSeenAt: new Date().toISOString(),
    trafficSource: normalizeTrafficSource(new URLSearchParams(search).get("utm_source"))
  };

  window.sessionStorage.setItem(SEO_ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
}

export function resolveStorefrontSourcePath(fallbackPath: string) {
  const stored = getStoredSeoLandingAttribution();
  return stored?.landingPath ?? fallbackPath;
}

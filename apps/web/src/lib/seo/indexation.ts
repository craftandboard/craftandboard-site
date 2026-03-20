import { marketingUrl } from "../site-config";

export const SEO_SITE_LAST_MODIFIED = "2026-03-14";
export const SEO_PROGRAMMATIC_CONTENT_LAST_UPDATED = "2026-03-14";

const NON_INDEXABLE_PREFIXES = [
  "/admin",
  "/api",
  "/order",
  "/proposal",
  "/deposit"
] as const;

export function isIndexablePath(pathname: string) {
  return !NON_INDEXABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getSitemapUrl() {
  return marketingUrl("/sitemap.xml");
}

export function buildGoogleSitemapPingUrl() {
  return `https://www.google.com/ping?sitemap=${encodeURIComponent(getSitemapUrl())}`;
}

export type IndexationPingResult = {
  ok: boolean;
  provider: "google" | "indexnow";
  url: string;
  status?: number;
  error?: string;
};

export async function pingGoogleSitemap(): Promise<IndexationPingResult> {
  const url = buildGoogleSitemapPingUrl();

  if (process.env.CRAFT_BOARD_ENABLE_SITEMAP_PINGS !== "true") {
    return {
      ok: false,
      provider: "google",
      url,
      error: "disabled"
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": "craft-board-indexation/1.0"
      },
      signal: AbortSignal.timeout(5000)
    });

    return {
      ok: response.ok,
      provider: "google",
      url,
      status: response.status,
      error: response.ok ? undefined : `http_${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      provider: "google",
      url,
      error: error instanceof Error ? error.message : "unknown_error"
    };
  }
}

export async function pingIndexNow(paths: string[]): Promise<IndexationPingResult> {
  const key = process.env.INDEXNOW_KEY?.trim();
  const enabled = process.env.CRAFT_BOARD_ENABLE_INDEXNOW === "true";
  const host = process.env.INDEXNOW_HOST?.trim();
  const endpoint = process.env.INDEXNOW_ENDPOINT?.trim() || "https://api.indexnow.org/indexnow";

  if (!enabled || !key || !host || paths.length === 0) {
    return {
      ok: false,
      provider: "indexnow",
      url: endpoint,
      error: "disabled"
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "craft-board-indexation/1.0"
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation: marketingUrl(`/${key}.txt`),
        urlList: paths.filter(isIndexablePath).map((path) => marketingUrl(path))
      }),
      signal: AbortSignal.timeout(5000)
    });

    return {
      ok: response.ok,
      provider: "indexnow",
      url: endpoint,
      status: response.status,
      error: response.ok ? undefined : `http_${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      provider: "indexnow",
      url: endpoint,
      error: error instanceof Error ? error.message : "unknown_error"
    };
  }
}

export async function submitIndexationSignal(paths: string[]) {
  const filteredPaths = paths.filter(isIndexablePath);

  const [google, indexnow] = await Promise.all([
    pingGoogleSitemap(),
    pingIndexNow(filteredPaths)
  ]);

  return {
    google,
    indexnow
  };
}

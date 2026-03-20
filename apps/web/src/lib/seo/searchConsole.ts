import { createSign } from "node:crypto";
import { marketingUrl } from "../site-config";
import { normalizeSeoPath, type SeoInventoryEntry } from "./inventory";

export type SearchConsolePageMetric = {
  path: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number;
  lookbackWindowDays: number;
  fetchedAt: string;
  matchedPath: string;
  querySamples?: string[];
  status: "MATCHED" | "UNMATCHED";
};

export type SearchConsoleQueryMetric = {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number;
  lookbackWindowDays: number;
  fetchedAt: string;
};

export type SearchConsoleSyncResult = {
  configured: boolean;
  fetchedAt: string;
  lookbackWindowDays: number;
  metrics: SearchConsolePageMetric[];
  errorMessage?: string | null;
};

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SEARCH_CONSOLE_API_BASE_URL = "https://searchconsole.googleapis.com/webmasters/v3";
const GOOGLE_WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

function getSearchConsoleConfig() {
  const enabled = process.env.CRAFT_BOARD_ENABLE_SEARCH_CONSOLE_SYNC === "true";
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || marketingUrl("/");
  const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim() || "";
  const privateKey = (process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").trim();

  return {
    enabled,
    siteUrl,
    clientEmail,
    privateKey
  };
}

export async function fetchSearchConsoleQueryMetrics(input: {
  lookbackWindowDays: number;
}): Promise<SearchConsoleQueryMetric[]> {
  const config = getSearchConsoleConfig();

  if (!config.enabled || !config.clientEmail || !config.privateKey || !config.siteUrl) {
    return [];
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const fetchedAt = new Date().toISOString();
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - Math.max(1, input.lookbackWindowDays - 1));

    const response = await fetch(
      `${GOOGLE_SEARCH_CONSOLE_API_BASE_URL}/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          dimensions: ["query"],
          rowLimit: 250
        }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return [];
    }

    const payload = await response.json() as {
      rows?: Array<{
        keys?: string[];
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
      }>;
    };

    return (payload.rows ?? [])
      .map((row) => ({
        query: row.keys?.[0] ?? "",
        impressions: row.impressions ?? 0,
        clicks: row.clicks ?? 0,
        ctr: row.ctr ?? 0,
        averagePosition: row.position ?? 0,
        lookbackWindowDays: input.lookbackWindowDays,
        fetchedAt
      }))
      .filter((row) => row.query.length > 0);
  } catch {
    return [];
  }
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createSignedJwt(input: {
  clientEmail: string;
  privateKey: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: input.clientEmail,
      sub: input.clientEmail,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      scope: GOOGLE_WEBMASTERS_SCOPE,
      iat: now,
      exp: now + 3600
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(input.privateKey);

  return `${header}.${payload}.${base64UrlEncode(signature)}`;
}

async function getGoogleAccessToken() {
  const config = getSearchConsoleConfig();
  const assertion = createSignedJwt({
    clientEmail: config.clientEmail,
    privateKey: config.privateKey
  });
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }).toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console token request failed (${response.status}): ${body}`);
  }

  const payload = await response.json() as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("Search Console token response did not include an access token.");
  }

  return payload.access_token;
}

export function normalizeSearchConsolePath(input: string) {
  return normalizeSeoPath(input);
}

export async function fetchSearchConsolePageMetrics(input: {
  inventory: SeoInventoryEntry[];
  lookbackWindowDays: number;
}): Promise<SearchConsoleSyncResult> {
  const config = getSearchConsoleConfig();
  const fetchedAt = new Date().toISOString();

  if (!config.enabled || !config.clientEmail || !config.privateKey || !config.siteUrl) {
    return {
      configured: false,
      fetchedAt,
      lookbackWindowDays: input.lookbackWindowDays,
      metrics: [],
      errorMessage: "Google Search Console is not configured."
    };
  }

  console.info("[web][seo] Fetching Search Console page metrics", {
    siteUrl: config.siteUrl,
    lookbackWindowDays: input.lookbackWindowDays
  });

  try {
    const accessToken = await getGoogleAccessToken();
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - Math.max(1, input.lookbackWindowDays - 1));

    const response = await fetch(
      `${GOOGLE_SEARCH_CONSOLE_API_BASE_URL}/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          dimensions: ["page"],
          rowLimit: 25000
        }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Search Console metrics request failed (${response.status}): ${body}`);
    }

    const payload = await response.json() as {
      rows?: Array<{
        keys?: string[];
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
      }>;
    };

    const inventoryPaths = new Set(input.inventory.map((entry) => entry.path));
    const metrics = (payload.rows ?? [])
      .map<SearchConsolePageMetric | null>((row) => {
        const rawPath = row.keys?.[0];

        if (!rawPath) {
          return null;
        }

        const normalized = normalizeSearchConsolePath(rawPath);

        return {
          path: rawPath,
          impressions: row.impressions ?? 0,
          clicks: row.clicks ?? 0,
          ctr: row.ctr ?? 0,
          averagePosition: row.position ?? 0,
          lookbackWindowDays: input.lookbackWindowDays,
          fetchedAt,
          matchedPath: normalized,
          status: inventoryPaths.has(normalized) ? "MATCHED" : "UNMATCHED"
        };
      })
      .filter((metric): metric is SearchConsolePageMetric => Boolean(metric));

    console.info("[web][seo] Search Console metrics normalized", {
      metrics: metrics.length,
      matched: metrics.filter((metric) => metric.status === "MATCHED").length
    });

    return {
      configured: true,
      fetchedAt,
      lookbackWindowDays: input.lookbackWindowDays,
      metrics
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Search Console error.";
    console.warn("[web][seo] Search Console fetch failed", { error: errorMessage });

    return {
      configured: true,
      fetchedAt,
      lookbackWindowDays: input.lookbackWindowDays,
      metrics: [],
      errorMessage
    };
  }
}

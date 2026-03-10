import { headers } from "next/headers";
import {
  APP_URL,
  MARKETING_URL,
  appUrl,
  isMarketingHostname,
  joinUrl,
  marketingUrl,
  normalizeHostname
} from "./site-config";

export interface RequestSiteContext {
  appUrl: string;
  host: string;
  hostname: string;
  isMarketingHost: boolean;
  marketingUrl: string;
  resolvedOrigin: string;
}

export async function getRequestSiteContext(): Promise<RequestSiteContext> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = requestHeaders.get("host") ?? forwardedHost ?? "";
  const hostname = normalizeHostname(forwardedHost ?? host);
  const isMarketingHost = isMarketingHostname(hostname);

  return {
    host,
    hostname,
    isMarketingHost,
    appUrl: APP_URL,
    marketingUrl: MARKETING_URL,
    resolvedOrigin: isMarketingHost ? MARKETING_URL : APP_URL
  };
}

export async function getAppRedirectUrl(pathname: string, search?: URLSearchParams) {
  const site = await getRequestSiteContext();
  if (!site.isMarketingHost) {
    return null;
  }

  const url = new URL(appUrl(pathname));
  if (search) {
    url.search = search.toString();
  }
  return url.toString();
}

export async function getCanonicalUrl(pathname = "/") {
  const site = await getRequestSiteContext();
  return joinUrl(site.isMarketingHost ? marketingUrl() : appUrl(), pathname);
}

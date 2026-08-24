import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getViewerContext } from "../api";
import { getHqDevBypassViewer } from "./dev-bypass";
import { HQ_HOME_PATH } from "./nav";
import type { HqViewer } from "./types";

/**
 * Header stamped by `src/middleware.ts` so a server component can build an
 * accurate `returnTo` without a client round trip.
 */
export const HQ_PATHNAME_HEADER = "x-hq-pathname";

export function parseHqAllowedEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isHqAllowedEmail(email: string, raw = process.env.HQ_ALLOWED_EMAILS) {
  const allowed = parseHqAllowedEmails(raw);

  if (allowed.length === 0) {
    return false;
  }

  return allowed.includes(email.trim().toLowerCase());
}

async function hqSignInPath() {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get(HQ_PATHNAME_HEADER) ?? HQ_HOME_PATH;
  const returnTo = pathname.startsWith("/") ? pathname : HQ_HOME_PATH;

  return `/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * The HQ gate.
 *
 * `src/middleware.ts` only checks that a session cookie is present. Real
 * identity is resolved here against the existing session API:
 *
 *   - no or invalid session -> back to Google with an explicit returnTo
 *   - signed in but not on HQ_ALLOWED_EMAILS -> 404, never 403, so the portal
 *     does not confirm its own existence to anyone outside the three of us
 */
export const requireHqViewer = cache(async function requireHqViewer(): Promise<HqViewer> {
  // Local-only escape hatch. Compiled out of production builds entirely.
  const bypassViewer = getHqDevBypassViewer("(hq)/layout");

  if (bypassViewer) {
    return bypassViewer;
  }

  const context = await getViewerContext();

  if (!context) {
    redirect(await hqSignInPath());
  }

  if (!isHqAllowedEmail(context.user.email)) {
    notFound();
  }

  return {
    email: context.user.email,
    name: context.user.name,
    organizationId: context.organization.id,
    organizationSlug: context.organization.slug
  };
});

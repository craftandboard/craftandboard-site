import type { HqViewer } from "./types";

/**
 * ===========================================================================
 * LOCAL DEVELOPMENT ONLY — HQ AUTH BYPASS
 * ===========================================================================
 *
 * Opens every (hq) route with no session and no allowlist so the pages can be
 * reviewed on a phone without fighting a Google round trip.
 *
 * Three gates, in this order:
 *
 *   1. `process.env.NODE_ENV !== "production"`
 *   2. `HQ_DEV_NO_AUTH === "1"` — explicit opt-in, never a default
 *   3. a loud `console.warn` every single time it fires, so it cannot be
 *      silently left on
 *
 * WHY GATE 1 IS STRUCTURAL, NOT JUST AN IF-CHECK:
 *
 * Next.js statically replaces `process.env.NODE_ENV` with the literal
 * "production" in a production build. Both functions below therefore compile
 * to `if ("production" === "production") return <disabled>;` — an
 * unconditional early return — and the minifier eliminates everything after
 * it as dead code. The env-var check, the viewer object, and the warning text
 * are not merely unreachable at runtime; they are absent from the production
 * bundle. `HQ_DEV_NO_AUTH=1` in a production environment has nothing left to
 * switch on.
 *
 * Verify after any change to this file:
 *
 *   pnpm --filter web build
 *   grep -r "HQ_DEV_NO_AUTH\|HQ AUTH BYPASS" apps/web/.next/server   # expect: no matches
 * ===========================================================================
 */

const HQ_DEV_BYPASS_VIEWER: HqViewer = {
  email: "dev-bypass@localhost",
  name: "HQ dev bypass",
  organizationId: "hq-dev-bypass",
  organizationSlug: "craft-and-board"
};

function warnBypassActive(where: string) {
  console.warn(
    [
      "",
      "  ****************************************************************",
      "  *  HQ AUTH BYPASS ACTIVE — NO SESSION, NO ALLOWLIST CHECK      *",
      `  *  fired in: ${where.padEnd(48)}*`,
      "  *  cause:    HQ_DEV_NO_AUTH=1 and NODE_ENV is not production   *",
      "  *  every (hq) route is OPEN to anyone who can reach this host  *",
      "  ****************************************************************",
      ""
    ].join("\n")
  );
}

/** Middleware-safe (no next/headers import). */
export function isHqDevBypassEnabled(where: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (process.env.HQ_DEV_NO_AUTH !== "1") {
    return false;
  }

  warnBypassActive(where);

  return true;
}

/** Returns a stand-in viewer when the bypass is on, otherwise null. */
export function getHqDevBypassViewer(where: string): HqViewer | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (process.env.HQ_DEV_NO_AUTH !== "1") {
    return null;
  }

  warnBypassActive(where);

  return HQ_DEV_BYPASS_VIEWER;
}

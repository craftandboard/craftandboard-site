/**
 * ===========================================================================
 * LOCAL DEVELOPMENT ONLY — HQ API DEV PARTNER
 * ===========================================================================
 *
 * Lets /hq/* writes work locally without a full Google OAuth loop, by
 * resolving the requester to a configured partner email instead of a session.
 *
 * Three gates, in this order:
 *
 *   1. `process.env.NODE_ENV !== "production"`
 *   2. `HQ_DEV_NO_AUTH === "1"` — explicit opt-in, never a default
 *   3. a loud `console.warn` every time it fires
 *
 * IMPORTANT DIFFERENCE FROM THE WEB TIER: apps/web is bundled, so its twin in
 * `apps/web/src/lib/hq/dev-bypass.ts` is physically removed from production
 * output by dead-code elimination. apps/api is compiled by `tsc`, which does
 * NOT eliminate dead code — this file ships in `dist/`. Gate 1 here is a
 * runtime check, not a compile-time deletion. It is still unreachable in
 * production because NODE_ENV is "production" there, but do not mistake it for
 * the stronger guarantee the web side has.
 * ===========================================================================
 */

const DEFAULT_DEV_PARTNER_EMAIL = "brandonbozarth30@gmail.com";

function warnDevPartnerActive(email: string) {
  console.warn(
    [
      "",
      "  ****************************************************************",
      "  *  HQ API DEV PARTNER ACTIVE — SESSION AUTH SKIPPED FOR /hq/*  *",
      `  *  acting as: ${email.padEnd(47)}*`,
      "  *  cause:     HQ_DEV_NO_AUTH=1 and NODE_ENV is not production  *",
      "  *  writes will be attributed to that partner                   *",
      "  ****************************************************************",
      ""
    ].join("\n")
  );
}

/** Returns the email to act as, or null when the bypass is off. */
export function getHqDevPartnerEmail(): string | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (process.env.HQ_DEV_NO_AUTH !== "1") {
    return null;
  }

  const email = (process.env.HQ_DEV_PARTNER_EMAIL ?? DEFAULT_DEV_PARTNER_EMAIL).trim();

  if (!email) {
    return null;
  }

  warnDevPartnerActive(email);

  return email;
}

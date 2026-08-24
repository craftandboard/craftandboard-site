/**
 * The Craft & Board HQ partner roster.
 *
 * `personName` is the key stored on HqPartnerResponse.personName. It must stay
 * in step with `prisma/seed-hq.ts` and `apps/web/src/content/hq/roles.ts`.
 *
 * Identity is ALWAYS derived from the authenticated session email through this
 * map. A personName supplied by a client is ignored.
 */
export interface HqRosterPartner {
  email: string;
  personName: string;
  fullName: string;
}

export const HQ_ROSTER: HqRosterPartner[] = [
  { email: "brandonbozarth30@gmail.com", personName: "Brandon", fullName: "Brandon Bozarth" },
  { email: "dekent1000@gmail.com", personName: "Tim", fullName: "Tim Turner" },
  { email: "tyler@sublimedesignnv.com", personName: "Tyler", fullName: "Tyler Phillips" }
];

/** The four questions. Matches HqPartnerResponse.question. */
export const HQ_QUESTION_NUMBERS = [1, 2, 3, 4] as const;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function personNameForEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  return HQ_ROSTER.find((partner) => partner.email === normalized)?.personName ?? null;
}

export function parseHqAllowedEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter((entry) => entry.length > 0);
}

/**
 * Fails closed: an unset or empty HQ_ALLOWED_EMAILS allows nobody.
 * Org membership alone is deliberately NOT sufficient for /hq/*.
 */
export function isHqAllowedEmail(email: string, raw = process.env.HQ_ALLOWED_EMAILS) {
  const allowed = parseHqAllowedEmails(raw);

  if (allowed.length === 0) {
    return false;
  }

  return allowed.includes(normalizeEmail(email));
}

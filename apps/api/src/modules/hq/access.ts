import type { Request } from "express";
import { prisma } from "../../lib/prisma.js";
import { getRequestContext } from "../../lib/requestContext.js";
import { getHqDevPartnerEmail } from "./devPartner.js";
import { isHqAllowedEmail, personNameForEmail } from "./partners.js";
import { HqAccessError } from "./service.js";

export interface HqRequester {
  userId: string;
  email: string;
  organizationId: string;
  /** null when an allowlisted email is not on the partner roster. */
  personName: string | null;
}

/**
 * The API-side HQ gate.
 *
 * Org membership is NOT sufficient — anyone holding a valid session token for
 * this organization could otherwise curl /hq/*. The same HQ_ALLOWED_EMAILS
 * check runs here as in the web tier, and a non-allowlisted caller gets 404
 * rather than 403 so the endpoints do not confirm their own existence.
 */
export async function requireHqRequester(req: Request): Promise<HqRequester> {
  const devPartnerEmail = getHqDevPartnerEmail();

  if (devPartnerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: devPartnerEmail },
      include: { memberships: { orderBy: [{ createdAt: "asc" }], take: 1 } }
    });

    if (!user || !user.memberships[0]) {
      throw new HqAccessError(
        `HQ dev partner ${devPartnerEmail} has no membership. Run: pnpm hq:seed`
      );
    }

    if (!isHqAllowedEmail(user.email)) {
      throw new HqAccessError();
    }

    return {
      userId: user.id,
      email: user.email,
      organizationId: user.memberships[0].organizationId,
      personName: personNameForEmail(user.email)
    };
  }

  const context = getRequestContext(req);

  if (!isHqAllowedEmail(context.currentUser.email)) {
    throw new HqAccessError();
  }

  return {
    userId: context.currentUser.id,
    email: context.currentUser.email,
    organizationId: context.currentOrganization.id,
    personName: personNameForEmail(context.currentUser.email)
  };
}

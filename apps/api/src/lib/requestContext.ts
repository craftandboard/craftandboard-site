import type { NextFunction, Request, Response } from "express";
import { env } from "./env.js";
import {
  buildClearedSessionCookie,
  findSessionUser,
  parseCookies,
  SESSION_COOKIE_NAME
} from "../modules/auth/session.js";
import {
  LOCAL_ORG_ID,
  LOCAL_ORG_NAME,
  LOCAL_ORG_SLUG,
  ensureDefaultProfiles
} from "../modules/settings/service.js";
import { hashPassword } from "../modules/auth/password.js";
import { prisma } from "./prisma.js";

const DEV_USER_EMAIL = "demo@craftboard.local";
const DEV_USER_NAME = "Craft & Board Owner";
const DEV_OPERATOR_EMAIL = "operator@craftboard.local";
const DEV_OPERATOR_NAME = "Craft & Board Operator";
const ALT_ORG_ID = "org_brady_builds_demo";
const ALT_ORG_NAME = "Brady Builds Demo";
const ALT_ORG_SLUG = "brady-builds-demo";

export class RequestAuthenticationError extends Error {}

export type ApiRequestContext = {
  currentUser: {
    id: string;
    email: string;
    name: string | null;
  };
  currentOrganization: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: "OWNER" | "ADMIN" | "OPERATOR";
  };
  organizations: Array<{
    id: string;
    slug: string;
    name: string;
    role: "OWNER" | "ADMIN" | "OPERATOR";
  }>;
};

declare global {
  namespace Express {
    interface Request {
      requestContext?: ApiRequestContext;
    }
  }
}

export async function ensureDefaultDevMembership() {
  await ensureDefaultProfiles();

  await prisma.organization.upsert({
    where: { id: ALT_ORG_ID },
    update: {
      name: ALT_ORG_NAME,
      slug: ALT_ORG_SLUG
    },
    create: {
      id: ALT_ORG_ID,
      name: ALT_ORG_NAME,
      slug: ALT_ORG_SLUG
    }
  });

  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {
      name: DEV_USER_NAME,
      organizationId: LOCAL_ORG_ID
    },
    create: {
      email: DEV_USER_EMAIL,
      name: DEV_USER_NAME,
      organizationId: LOCAL_ORG_ID,
      passwordHash: hashPassword("demo1234")
    }
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: LOCAL_ORG_ID,
        userId: user.id
      }
    },
    update: {
      role: "OWNER"
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      userId: user.id,
      role: "OWNER"
    }
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: ALT_ORG_ID,
        userId: user.id
      }
    },
    update: {
      role: "ADMIN"
    },
    create: {
      organizationId: ALT_ORG_ID,
      userId: user.id,
      role: "ADMIN"
    }
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: DEV_OPERATOR_EMAIL },
    update: {
      name: DEV_OPERATOR_NAME,
      organizationId: LOCAL_ORG_ID
    },
    create: {
      email: DEV_OPERATOR_EMAIL,
      name: DEV_OPERATOR_NAME,
      organizationId: LOCAL_ORG_ID,
      passwordHash: hashPassword("operator1234")
    }
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: LOCAL_ORG_ID,
        userId: operatorUser.id
      }
    },
    update: {
      role: "OPERATOR"
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      userId: operatorUser.id,
      role: "OPERATOR"
    }
  });
}

function buildContextFromResolvedUser(input: {
  user: {
    id: string;
    email: string;
    name: string | null;
    organizationId: string;
    memberships: Array<{
      id: string;
      organizationId: string;
      role: "OWNER" | "ADMIN" | "OPERATOR";
      organization: {
        id: string;
        slug: string | null;
        name: string;
      };
    }>;
  };
  requestedOrganizationSlug?: string | null;
}) {
  const membership =
    (input.requestedOrganizationSlug
      ? input.user.memberships.find(
          (candidate) => candidate.organization.slug === input.requestedOrganizationSlug
        )
      : input.user.memberships.find((candidate) => candidate.organizationId === input.user.organizationId)) ??
    input.user.memberships[0];

  if (!membership) {
    throw new RequestAuthenticationError(
      `User ${input.user.email} is not a member of any organization.`
    );
  }

  if (input.requestedOrganizationSlug && membership.organization.slug !== input.requestedOrganizationSlug) {
    throw new RequestAuthenticationError(
      `User ${input.user.email} is not a member of organization ${input.requestedOrganizationSlug}.`
    );
  }

  return {
    currentUser: {
      id: input.user.id,
      email: input.user.email,
      name: input.user.name
    },
    currentOrganization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug ?? LOCAL_ORG_SLUG
    },
    membership: {
      id: membership.id,
      role: membership.role
    },
    organizations: input.user.memberships.map((candidate) => ({
      id: candidate.organization.id,
      slug: candidate.organization.slug ?? LOCAL_ORG_SLUG,
      name: candidate.organization.name,
      role: candidate.role
    }))
  } satisfies ApiRequestContext;
}

function sessionTokenFromRequest(req: Request) {
  const headerToken = req.header("x-session-token");

  if (headerToken) {
    return headerToken;
  }

  const cookies = parseCookies(req.header("cookie"));
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

export async function resolveRequestContext(input?: {
  userEmail?: string | null;
  organizationSlug?: string | null;
  sessionToken?: string | null;
}): Promise<ApiRequestContext> {
  await ensureDefaultDevMembership();

  const requestedOrganizationSlug = input?.organizationSlug?.trim() || null;
  const session = await findSessionUser(input?.sessionToken ?? null);

  if (session) {
    return buildContextFromResolvedUser({
      user: session.user,
      requestedOrganizationSlug
    });
  }

  if (!env.ALLOW_DEV_AUTH_BYPASS) {
    throw new RequestAuthenticationError("Authentication required.");
  }

  const userEmail = input?.userEmail?.trim() || DEV_USER_EMAIL;
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      memberships: {
        include: {
          organization: true
        },
        orderBy: [{ createdAt: "asc" }]
      }
    }
  });

  if (!user) {
    throw new RequestAuthenticationError(`User ${userEmail} was not found.`);
  }

  return buildContextFromResolvedUser({
    user,
    requestedOrganizationSlug
  });
}

export async function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const isPublicRoute =
      req.path === "/health" ||
      req.method === "POST" && req.path === "/craft-board/inquiries" ||
      req.path.startsWith("/public/craft-board/pricing/") ||
      req.path.startsWith("/public/craft-board/storefront/") ||
      req.path.startsWith("/public/craft-board/storefront-orders/") ||
      req.path.startsWith("/public/craft-board/deposits/") ||
      req.path.startsWith("/public/craft-board/proposals/") ||
      req.path.startsWith("/auth/login") ||
      req.path.startsWith("/auth/logout") ||
      req.path.startsWith("/auth/activate") ||
      req.path.startsWith("/auth/forgot-password") ||
      req.path.startsWith("/auth/reset-password") ||
      req.path.startsWith("/public/proposal-acceptance/") ||
      req.path.startsWith("/payments/providers/") && req.path.endsWith("/acceptance-signals");

    req.requestContext = await resolveRequestContext({
      userEmail: req.header("x-user-email"),
      organizationSlug: req.header("x-organization-slug"),
      sessionToken: sessionTokenFromRequest(req)
    });
    next();
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      const isPublicRoute =
        req.path === "/health" ||
        req.method === "POST" && req.path === "/craft-board/inquiries" ||
        req.path.startsWith("/public/craft-board/pricing/") ||
        req.path.startsWith("/public/craft-board/storefront/") ||
        req.path.startsWith("/public/craft-board/storefront-orders/") ||
        req.path.startsWith("/public/craft-board/deposits/") ||
        req.path.startsWith("/public/craft-board/proposals/") ||
        req.path.startsWith("/auth/login") ||
        req.path.startsWith("/auth/logout") ||
        req.path.startsWith("/auth/activate") ||
        req.path.startsWith("/auth/forgot-password") ||
        req.path.startsWith("/auth/reset-password") ||
        req.path.startsWith("/public/proposal-acceptance/") ||
        req.path.startsWith("/payments/providers/") && req.path.endsWith("/acceptance-signals");

      if (isPublicRoute) {
        next();
        return;
      }

      if (error.message === "Authentication required.") {
        res
          .status(401)
          .setHeader("Set-Cookie", buildClearedSessionCookie())
          .json({
            ok: false,
            error: error.message
          });
        return;
      }

      res.status(error.message.includes("not found") ? 404 : 403).json({
        ok: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
}

export function getRequestContext(req: Request): ApiRequestContext {
  if (!req.requestContext) {
    throw new RequestAuthenticationError("Authentication required.");
  }

  return req.requestContext;
}

export {
  DEV_USER_EMAIL,
  DEV_USER_NAME,
  DEV_OPERATOR_EMAIL,
  DEV_OPERATOR_NAME,
  ALT_ORG_ID,
  ALT_ORG_NAME,
  ALT_ORG_SLUG,
  LOCAL_ORG_ID,
  LOCAL_ORG_NAME,
  LOCAL_ORG_SLUG
};

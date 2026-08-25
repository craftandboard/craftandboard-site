import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";
import type { ApiRequestContext } from "../../lib/requestContext.js";
import {
  DEV_OPERATOR_EMAIL,
  DEV_USER_EMAIL,
  ensureDefaultDevMembership,
  resolveRequestContext
} from "../../lib/requestContext.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createActivationToken,
  getValidActivationToken,
  invalidActivationError
} from "./activation.js";
import {
  createUserSession,
  revokeSession,
  revokeUserSessions
} from "./session.js";
import {
  createPasswordResetToken,
  getValidPasswordResetToken,
  invalidResetError
} from "./reset.js";

const DEMO_OWNER_PASSWORD = "demo1234";
const DEMO_OPERATOR_PASSWORD = "operator1234";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const CANONICAL_OWNER_EMAIL = "brandonbozarth30@gmail.com";
const CANONICAL_OWNER_NAME = "Brandon Bozarth";

export class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code = "auth_error") {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

export class GoogleAuthConfigurationError extends Error {
  code: string;

  constructor(message: string, code = "google_not_configured") {
    super(message);
    this.name = "GoogleAuthConfigurationError";
    this.code = code;
  }
}

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function logGoogleAuth(level: "warn" | "error", event: string, details: Record<string, unknown>) {
  console[level](`[auth][google] ${event}`, details);
}

/**
 * Gives the demo owner and operator accounts usable passwords.
 *
 * DEVELOPMENT ONLY, and gated on the same flag as ensureDefaultDevMembership()
 * for the same reason. It must not run in a deployed environment: the
 * findUniqueOrThrow calls below assume the demo users exist, which is only
 * guaranteed once the dev fixtures have been seeded.
 *
 * Skipping this in production costs the real sign-in paths nothing.
 * signInWithPassword and signInWithGoogleCode look the caller up by their own
 * email and never read the demo accounts.
 */
export async function ensureSeededAuthUsers() {
  if (!env.ALLOW_DEV_AUTH_BYPASS) {
    return;
  }

  await ensureDefaultDevMembership();

  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: DEV_USER_EMAIL }
  });
  const operator = await prisma.user.findUniqueOrThrow({
    where: { email: DEV_OPERATOR_EMAIL }
  });

  if (!owner.passwordHash) {
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        passwordHash: hashPassword(DEMO_OWNER_PASSWORD)
      }
    });
  }

  if (!operator.passwordHash) {
    await prisma.user.update({
      where: { id: operator.id },
      data: {
        passwordHash: hashPassword(DEMO_OPERATOR_PASSWORD)
      }
    });
  }

  const canonicalOwner = await prisma.user.upsert({
    where: { email: CANONICAL_OWNER_EMAIL },
    update: {
      name: CANONICAL_OWNER_NAME,
      organizationId: LOCAL_ORG_ID
    },
    create: {
      email: CANONICAL_OWNER_EMAIL,
      name: CANONICAL_OWNER_NAME,
      organizationId: LOCAL_ORG_ID
    }
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: LOCAL_ORG_ID,
        userId: canonicalOwner.id
      }
    },
    update: {
      role: "OWNER"
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      userId: canonicalOwner.id,
      role: "OWNER"
    }
  });
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  await ensureSeededAuthUsers();

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      memberships: {
        include: {
          organization: true
        },
        orderBy: [{ createdAt: "asc" }]
      }
    }
  });

  if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    throw new AuthenticationError("Invalid email or password.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date()
    }
  });

  const session = await createUserSession(user.id);
  const context = await resolveRequestContext({
    sessionToken: session.token
  });

  return {
    session,
    context
  };
}

function assertGoogleAuthConfigured() {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

  if (!clientId || !clientSecret) {
    throw new GoogleAuthConfigurationError(
      "Google sign-in is not configured. Missing GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET."
    );
  }

  return {
    clientId,
    clientSecret
  };
}

async function getGoogleUserInfo(input: { code: string; redirectUri: string }) {
  const { clientId, clientSecret } = assertGoogleAuthConfigured();

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri
    }).toString()
  });

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    logGoogleAuth("warn", "token_exchange_failed", {
      ok: tokenResponse.ok,
      status: tokenResponse.status,
      error: tokenPayload.error,
      errorDescription: tokenPayload.error_description
    });
    throw new AuthenticationError(
      tokenPayload.error_description || tokenPayload.error || "Google sign-in could not be completed.",
      "google_exchange_failed"
    );
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;

  if (!userInfoResponse.ok || !userInfo.email || !userInfo.email_verified) {
    logGoogleAuth("warn", "userinfo_failed", {
      ok: userInfoResponse.ok,
      status: userInfoResponse.status,
      email: userInfo.email ?? null,
      emailVerified: userInfo.email_verified ?? null
    });
    throw new AuthenticationError(
      "This Google account could not be verified for Craft & Board Admin.",
      "google_userinfo_failed"
    );
  }

  return userInfo;
}

export function getGoogleAuthConfigStatus() {
  return {
    enabled: Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim()),
    missing: [
      ...(env.GOOGLE_CLIENT_ID?.trim() ? [] : ["GOOGLE_CLIENT_ID"]),
      ...(env.GOOGLE_CLIENT_SECRET?.trim() ? [] : ["GOOGLE_CLIENT_SECRET"])
    ]
  };
}

export async function signInWithGoogleCode(input: {
  code: string;
  redirectUri: string;
}) {
  await ensureSeededAuthUsers();

  const googleUser = await getGoogleUserInfo(input);
  const email = googleUser.email?.trim().toLowerCase();

  if (!email) {
    logGoogleAuth("warn", "missing_email", {
      googleName: googleUser.name ?? null
    });
    throw new AuthenticationError(
      "This Google account did not return a usable email address.",
      "google_email_missing"
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
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
    logGoogleAuth("warn", "missing_user", {
      email
    });
    throw new AuthenticationError(
      "This Google account is not authorized for Craft & Board Admin.",
      "google_unauthorized"
    );
  }

  if (user.memberships.length === 0) {
    logGoogleAuth("warn", "missing_org_access", {
      email,
      userId: user.id
    });
    throw new AuthenticationError(
      "This Google account is not authorized for Craft & Board Admin.",
      "google_no_memberships"
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      name: user.name ?? googleUser.name ?? null
    }
  });

  let session;

  try {
    session = await createUserSession(user.id);
  } catch (error) {
    logGoogleAuth("error", "session_creation_failed", {
      email,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new AuthenticationError(
      "Google sign-in could not create a session for this account.",
      "google_session_failed"
    );
  }

  let context: ApiRequestContext;

  try {
    context = await resolveRequestContext({
      sessionToken: session.token
    });
  } catch (error) {
    logGoogleAuth("error", "context_resolution_failed", {
      email,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new AuthenticationError(
      "Google sign-in could not finish the admin session.",
      "google_context_failed"
    );
  }

  return {
    session,
    context
  };
}

export async function signOutSession(token?: string | null) {
  await revokeSession(token);
}

export async function requestPasswordReset(input: { email: string }) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email.trim().toLowerCase()
    }
  });

  if (!user) {
    return {
      ok: true as const
    };
  }

  const reset = await createPasswordResetToken(user.id);

  return {
    ok: true as const,
    reset: {
      path: reset.path
    }
  };
}

export async function getPasswordResetTokenContext(token: string) {
  const reset = await getValidPasswordResetToken(token);

  return {
    ok: true as const,
    user: {
      email: reset.user.email,
      name: reset.user.name
    },
    reset: {
      expiresAt: reset.expiresAt.toISOString()
    }
  };
}

export async function resetPassword(input: { token: string; password: string }) {
  const reset = await getValidPasswordResetToken(input.token);
  const usedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: reset.userId
      },
      data: {
        passwordHash: hashPassword(input.password)
      }
    });

    await tx.passwordResetToken.update({
      where: {
        id: reset.id
      },
      data: {
        usedAt
      }
    });
  });

  await revokeUserSessions(reset.userId);

  const session = await createUserSession(reset.userId);
  const context = await resolveRequestContext({
    sessionToken: session.token
  });

  return {
    session,
    context
  };
}

export async function getActivationTokenContext(token: string) {
  const activation = await getValidActivationToken(token);

  return {
    ok: true as const,
    user: {
      email: activation.user.email,
      name: activation.user.name
    },
    activation: {
      expiresAt: activation.expiresAt.toISOString()
    }
  };
}

export async function activateAccount(input: { token: string; password: string }) {
  const activation = await getValidActivationToken(input.token);

  const usedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: activation.userId
      },
      data: {
        passwordHash: hashPassword(input.password)
      }
    });

    await tx.activationToken.update({
      where: {
        id: activation.id
      },
      data: {
        usedAt
      }
    });
  });

  const session = await createUserSession(activation.userId);
  const context = await resolveRequestContext({
    sessionToken: session.token
  });

  return {
    session,
    context
  };
}

export async function createActivationForUser(userId: string) {
  return createActivationToken(userId);
}

export async function getAuthSessionContext(context: ApiRequestContext) {
  return {
    ok: true as const,
    user: {
      email: context.currentUser.email,
      name: context.currentUser.name
    },
    organization: context.currentOrganization,
    membership: context.membership,
    organizations: context.organizations
  };
}

export const DEMO_AUTH_CREDENTIALS = {
  owner: {
    email: DEV_USER_EMAIL,
    password: DEMO_OWNER_PASSWORD
  },
  operator: {
    email: DEV_OPERATOR_EMAIL,
    password: DEMO_OPERATOR_PASSWORD
  }
};

export { invalidActivationError };
export { invalidResetError };

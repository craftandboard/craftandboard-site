import { prisma } from "../../lib/prisma.js";
import type { ApiRequestContext } from "../../lib/requestContext.js";
import {
  DEV_OPERATOR_EMAIL,
  DEV_USER_EMAIL,
  ensureDefaultDevMembership,
  resolveRequestContext
} from "../../lib/requestContext.js";
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

export class AuthenticationError extends Error {}

export async function ensureSeededAuthUsers() {
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

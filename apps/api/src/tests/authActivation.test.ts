import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  activationToken: {
    create: vi.fn(),
    findUnique: vi.fn()
  },
  user: {
    update: vi.fn()
  },
  $transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
    callback({
      user: {
        update: prismaMock.user.update
      },
      activationToken: {
        update: vi.fn()
      }
    })
  )
}));

const activationTxMock = vi.hoisted(() => ({
  update: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    ...prismaMock,
    $transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        user: {
          update: prismaMock.user.update
        },
        activationToken: activationTxMock
      })
    )
  }
}));

vi.mock("../lib/requestContext.js", () => ({
  DEV_OPERATOR_EMAIL: "operator@craftboard.local",
  DEV_USER_EMAIL: "demo@craftboard.local",
  ensureDefaultDevMembership: vi.fn(),
  resolveRequestContext: vi.fn(async () => ({
    currentUser: {
      id: "user_tyler",
      email: "tyler@example.com",
      name: "Tyler Phillips"
    },
    currentOrganization: {
      id: "org_local_craft_board",
      name: "Craft & Board Demo",
      slug: "craft-board-demo"
    },
    membership: {
      id: "membership_tyler",
      role: "OPERATOR"
    },
    organizations: [
      {
        id: "org_local_craft_board",
        slug: "craft-board-demo",
        name: "Craft & Board Demo",
        role: "OPERATOR"
      }
    ]
  }))
}));

vi.mock("../modules/auth/session.js", () => ({
  createUserSession: vi.fn(async () => ({
    token: "session-token-123",
    expiresAt: new Date("2026-03-22T00:00:00.000Z")
  })),
  revokeSession: vi.fn()
}));

import {
  activateAccount,
  getActivationTokenContext
} from "../modules/auth/service.js";
import { createActivationToken } from "../modules/auth/activation.js";

describe("account activation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a hashed activation token and returns an activation path", async () => {
    const result = await createActivationToken("user_tyler");

    expect(prismaMock.activationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_tyler",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date)
      })
    });
    expect(result.path).toContain("/activate?token=");
    expect(prismaMock.activationToken.create.mock.calls[0][0].data.tokenHash).not.toBe(result.token);
  });

  it("validates an activation token once", async () => {
    prismaMock.activationToken.findUnique.mockResolvedValue({
      id: "activation_1",
      userId: "user_tyler",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      usedAt: null,
      user: {
        email: "tyler@example.com",
        name: "Tyler Phillips",
        memberships: []
      }
    });

    const result = await getActivationTokenContext("activation-token");

    expect(result.ok).toBe(true);
    expect(result.user.email).toBe("tyler@example.com");
  });

  it("activates the account, consumes the token, and creates a session", async () => {
    prismaMock.activationToken.findUnique.mockResolvedValue({
      id: "activation_1",
      userId: "user_tyler",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      usedAt: null,
      user: {
        email: "tyler@example.com",
        name: "Tyler Phillips",
        memberships: []
      }
    });

    const result = await activateAccount({
      token: "activation-token",
      password: "supersecure123"
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: {
        id: "user_tyler"
      },
      data: {
        passwordHash: expect.any(String)
      }
    });
    expect(activationTxMock.update).toHaveBeenCalledWith({
      where: {
        id: "activation_1"
      },
      data: {
        usedAt: expect.any(Date)
      }
    });
    expect(result.session.token).toBe("session-token-123");
    expect(result.context.currentUser.email).toBe("tyler@example.com");
  });
});

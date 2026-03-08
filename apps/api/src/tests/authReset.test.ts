import { beforeEach, describe, expect, it, vi } from "vitest";

const resetTxMock = vi.hoisted(() => ({
  user: {
    update: vi.fn()
  },
  passwordResetToken: {
    update: vi.fn()
  }
}));

const prismaMock = vi.hoisted(() => ({
  passwordResetToken: {
    create: vi.fn(),
    findUnique: vi.fn()
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  session: {
    deleteMany: vi.fn()
  },
  $transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) => callback(resetTxMock))
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));

vi.mock("../lib/requestContext.js", () => ({
  DEV_OPERATOR_EMAIL: "operator@craftboard.local",
  DEV_USER_EMAIL: "demo@craftboard.local",
  ensureDefaultDevMembership: vi.fn(),
  resolveRequestContext: vi.fn(async () => ({
    currentUser: {
      id: "user_reset",
      email: "reset-user@example.com",
      name: "Reset User"
    },
    currentOrganization: {
      id: "org_local_craft_board",
      name: "Craft & Board Demo",
      slug: "craft-board-demo"
    },
    membership: {
      id: "membership_reset",
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
    token: "reset-session-token",
    expiresAt: new Date("2026-03-22T00:00:00.000Z")
  })),
  revokeSession: vi.fn(),
  revokeUserSessions: vi.fn(async () => undefined)
}));

import {
  getPasswordResetTokenContext,
  requestPasswordReset,
  resetPassword
} from "../modules/auth/service.js";
import { createPasswordResetToken } from "../modules/auth/reset.js";

describe("password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns generic success when the email does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await requestPasswordReset({
      email: "missing@example.com"
    });

    expect(result).toEqual({ ok: true });
  });

  it("creates a hashed reset token and returns a reset path", async () => {
    const result = await createPasswordResetToken("user_reset");

    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_reset",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date)
      })
    });
    expect(result.path).toContain("/reset-password?token=");
    expect(prismaMock.passwordResetToken.create.mock.calls[0][0].data.tokenHash).not.toBe(result.token);
  });

  it("resets a password, consumes the token, and returns a new session", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset_1",
      userId: "user_reset",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      usedAt: null,
      user: {
        email: "reset-user@example.com",
        name: "Reset User",
        memberships: []
      }
    });

    const result = await resetPassword({
      token: "reset-token",
      password: "brandnew123"
    });

    expect(resetTxMock.user.update).toHaveBeenCalledWith({
      where: {
        id: "user_reset"
      },
      data: {
        passwordHash: expect.any(String)
      }
    });
    expect(resetTxMock.passwordResetToken.update).toHaveBeenCalledWith({
      where: {
        id: "reset_1"
      },
      data: {
        usedAt: expect.any(Date)
      }
    });
    expect(result.session.token).toBe("reset-session-token");
  });

  it("rejects a used reset token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset_1",
      userId: "user_reset",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      usedAt: new Date(),
      user: {
        email: "reset-user@example.com",
        name: "Reset User",
        memberships: []
      }
    });

    await expect(getPasswordResetTokenContext("reset-token")).rejects.toThrow(
      "Reset token is invalid or expired."
    );
  });
});

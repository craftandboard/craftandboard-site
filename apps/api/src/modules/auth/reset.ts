import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma.js";

const RESET_TTL_MS = 1000 * 60 * 60 * 2;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createResetTokenValue() {
  return randomBytes(32).toString("hex");
}

function invalidResetError() {
  return new Error("Reset token is invalid or expired.");
}

export async function createPasswordResetToken(userId: string) {
  const token = createResetTokenValue();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    token,
    expiresAt,
    path: `/reset-password?token=${encodeURIComponent(token)}`
  };
}

export async function getValidPasswordResetToken(token: string) {
  const reset = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashResetToken(token)
    },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              organization: true
            },
            orderBy: [{ createdAt: "asc" }]
          }
        }
      }
    }
  });

  if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) {
    throw invalidResetError();
  }

  return reset;
}

export { invalidResetError };

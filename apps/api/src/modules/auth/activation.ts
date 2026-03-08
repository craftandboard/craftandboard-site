import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma.js";

const ACTIVATION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function hashActivationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createActivationTokenValue() {
  return randomBytes(32).toString("hex");
}

function invalidActivationError() {
  return new Error("Activation token is invalid or expired.");
}

export async function createActivationToken(userId: string) {
  const token = createActivationTokenValue();
  const tokenHash = hashActivationToken(token);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);

  await prisma.activationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    token,
    expiresAt,
    path: `/activate?token=${encodeURIComponent(token)}`
  };
}

export async function getValidActivationToken(token: string) {
  const activation = await prisma.activationToken.findUnique({
    where: {
      tokenHash: hashActivationToken(token)
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

  if (!activation || activation.usedAt || activation.expiresAt.getTime() <= Date.now()) {
    throw invalidActivationError();
  }

  return activation;
}

export async function markActivationTokenUsed(id: string, usedAt = new Date()) {
  await prisma.activationToken.update({
    where: { id },
    data: {
      usedAt
    }
  });
}

export { invalidActivationError };

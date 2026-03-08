import { createHash, randomBytes } from "node:crypto";
import type { Response } from "express";
import { prisma } from "../../lib/prisma.js";

export const SESSION_COOKIE_NAME = "cb_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function parseCookies(header?: string | null) {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...value] = part.split("=");
        return [name, decodeURIComponent(value.join("="))];
      })
  );
}

export async function createUserSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    token,
    expiresAt
  };
}

export async function findSessionUser(token?: string | null) {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token)
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

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({
      where: { id: session.id }
    });
    return null;
  }

  return session;
}

export async function revokeSession(token?: string | null) {
  if (!token) {
    return;
  }

  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({
    where: {
      tokenHash
    }
  });
}

export async function revokeUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: {
      userId
    }
  });
}

export function buildSessionCookie(token: string, expiresAt: Date) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(
    (expiresAt.getTime() - Date.now()) / 1000
  )}; SameSite=Lax`;
}

export function buildClearedSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.setHeader("Set-Cookie", buildSessionCookie(token, expiresAt));
}

export function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", buildClearedSessionCookie());
}

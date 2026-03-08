import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, digest] = passwordHash.split(":");

  if (scheme !== "scrypt" || !salt || !digest) {
    return false;
  }

  const input = Buffer.from(scryptSync(password, salt, KEY_LENGTH).toString("hex"), "utf8");
  const stored = Buffer.from(digest, "utf8");

  if (input.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(input, stored);
}

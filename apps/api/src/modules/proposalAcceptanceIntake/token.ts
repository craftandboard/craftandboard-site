import crypto from "node:crypto";

export function generateAcceptanceToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAcceptanceToken(token: string) {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

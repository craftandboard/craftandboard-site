import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_SCOPE = "openid email profile";
const GOOGLE_STATE_COOKIE = "cb_google_state";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    return NextResponse.redirect(new URL("/login?google=not-configured", request.url));
  }

  const requestUrl = new URL(request.url);
  const returnTo = requestUrl.searchParams.get("returnTo") || "/admin/craft-board/dashboard";
  const nonce = randomUUID();
  const redirectUri = new URL("/auth/google/callback", request.url).toString();
  const googleUrl = new URL(GOOGLE_AUTHORIZE_URL);

  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", GOOGLE_SCOPE);
  googleUrl.searchParams.set("prompt", "select_account");
  googleUrl.searchParams.set("state", nonce);

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set(
    GOOGLE_STATE_COOKIE,
    JSON.stringify({ nonce, returnTo }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10
    }
  );

  return response;
}

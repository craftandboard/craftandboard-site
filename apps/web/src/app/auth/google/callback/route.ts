import { NextResponse } from "next/server";
import { completeGoogleSignIn } from "../../../../lib/api";

const GOOGLE_STATE_COOKIE = "cb_google_state";

function redirectWithError(request: Request, code: string) {
  return NextResponse.redirect(new URL(`/login?google=${code}`, request.url));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const googleError = requestUrl.searchParams.get("error");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${GOOGLE_STATE_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (googleError) {
    return redirectWithError(request, "denied");
  }

  if (!cookieValue || !state || !code) {
    return redirectWithError(request, "state");
  }

  let parsedState: { nonce: string; returnTo?: string } | null = null;

  try {
    parsedState = JSON.parse(decodeURIComponent(cookieValue)) as { nonce: string; returnTo?: string };
  } catch {
    return redirectWithError(request, "state");
  }

  if (!parsedState?.nonce || parsedState.nonce !== state) {
    return redirectWithError(request, "state");
  }

  const redirectUri = new URL("/auth/google/callback", request.url).toString();

  try {
    const response = await completeGoogleSignIn({
      code,
      redirectUri
    });

    if (!response.ok) {
      const errorCode = response.error.includes("not authorized")
        ? "unauthorized"
        : response.error.includes("not configured")
          ? "not-configured"
          : "failed";
      return redirectWithError(request, errorCode);
    }

    const redirectTarget = parsedState.returnTo?.startsWith("/")
      ? parsedState.returnTo
      : "/admin/craft-board/dashboard";
    const redirectResponse = NextResponse.redirect(new URL(redirectTarget, request.url));

    redirectResponse.cookies.set("cb_session", response.sessionToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false
    });
    redirectResponse.cookies.set("cb_org_slug", response.organization.slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false
    });
    redirectResponse.cookies.set(GOOGLE_STATE_COOKIE, "", {
      path: "/",
      maxAge: 0
    });

    return redirectResponse;
  } catch {
    return redirectWithError(request, "failed");
  }
}

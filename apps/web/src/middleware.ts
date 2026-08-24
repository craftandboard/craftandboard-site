import { NextResponse, type NextRequest } from "next/server";
import { isHqDevBypassEnabled } from "./lib/hq/dev-bypass";

/**
 * HQ-only middleware.
 *
 * Scoped by the matcher below to `/hq` and nothing else, so no existing route
 * changes behavior. It performs the cheap half of the gate — a session cookie
 * must be present — and stamps the requested path so `(hq)/layout.tsx` can
 * build an accurate `returnTo`. Real identity and allowlist checks happen in
 * that layout, which can reach the session API; see `lib/hq/access.ts`.
 *
 * The existing `/auth/google/start` default `returnTo` is untouched: an
 * explicit `returnTo` is always supplied here.
 */

const SESSION_COOKIE = "cb_session";
const HQ_PATHNAME_HEADER = "x-hq-pathname";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestedPath = `${pathname}${search}`;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value?.trim();

  // Local-only escape hatch. Compiled out of production builds entirely.
  const bypassed = isHqDevBypassEnabled("middleware");

  if (!bypassed && !sessionToken) {
    const startUrl = new URL("/auth/google/start", request.url);
    startUrl.searchParams.set("returnTo", requestedPath);

    return NextResponse.redirect(startUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HQ_PATHNAME_HEADER, requestedPath);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/hq", "/hq/:path*"]
};

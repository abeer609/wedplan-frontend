import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic route guard: if no Better Auth session cookie is present,
// send guests to /signin with a ?redirect= target. The dashboard layout and
// the backend remain the real authority (role checks happen there).
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/payment"];
const SESSION_COOKIE_MARKERS = ["session_token", "session_data"];

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("session_token") ||
        SESSION_COOKIE_MARKERS.some((m) => c.name.includes(m)),
    );
}

function isProtected(pathname: string) {
  if (pathname.startsWith("/services/")) return true;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();
  if (hasSessionCookie(request)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = `?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/services/:path*", "/dashboard/:path*", "/onboarding", "/payment/:path*"],
};

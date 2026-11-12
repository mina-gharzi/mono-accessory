import { NextResponse, type NextRequest } from "next/server";

// Must match SESSION_COOKIE in src/server/auth/session.ts.
const SESSION_COOKIE = "mono_session";
const PROTECTED_PREFIXES = [
  "/account",
  "/admin",
  "/cart",
  "/checkout",
  "/payment",
];

// Optimistic check only: a cookie can be present but invalid or expired.
// The real authentication and role checks live in the protected layouts.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", `${pathname}${search}`);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
    "/cart",
    "/checkout",
    "/checkout/:path*",
    "/payment",
    "/payment/:path*",
  ],
};

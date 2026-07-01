import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, buildMainLoginRedirect } from "@/lib/auth/cookie";
import { verifySessionToken } from "@/lib/auth/jwt";

const PUBLIC_PREFIXES = ["/api/auth/callback", "/api/auth/logout", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token && (await verifySessionToken(token))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(buildMainLoginRedirect(request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|image/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

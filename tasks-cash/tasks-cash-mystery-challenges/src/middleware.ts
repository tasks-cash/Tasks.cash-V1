import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";
import { buildMainLoginRedirect } from "@/lib/auth/cookie";
import { verifySessionToken } from "@/lib/auth/jwt";
import { isProtectedPath } from "@/lib/auth/config";

const PUBLIC_API_PREFIXES = ["/api/auth/callback", "/api/auth/logout", "/api/auth/session", "/api/health"];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/")) {
      if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.next();
    }

    if (!isProtectedPath(pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token && (await verifySessionToken(token))) {
      return NextResponse.next();
    }

    const returnUrl = `${request.nextUrl.origin}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(buildMainLoginRedirect(returnUrl));
  } catch (error) {
    console.error("[middleware]", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|image/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|webm|wav|ogg|mp4)).*)",
  ],
};

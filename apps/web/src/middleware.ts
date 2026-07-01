import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  isAuthPage,
  isProtectedPath,
  isPublicLegalPage,
} from "@/lib/auth/config";
import { buildPostLoginRedirect, DEFAULT_REDIRECT, getLoginUrl } from "@/lib/auth/redirect";
import { verifyAccessToken } from "@/lib/auth/jwt";

function readToken(request: NextRequest): string | null {
  return (
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    null
  );
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/") || isPublicLegalPage(pathname)) {
      return NextResponse.next();
    }

    const token = readToken(request);
    const payload = token ? await verifyAccessToken(token) : null;
    const authenticated = Boolean(payload);

    if (isAuthPage(pathname)) {
      if (authenticated && token) {
        const rawRedirect = request.nextUrl.searchParams.get("redirect");
        const next = buildPostLoginRedirect(rawRedirect, token);
        const pathOnly = next.startsWith("http") ? new URL(next).pathname : next.split("?")[0];

        if (isAuthPage(pathOnly)) {
          return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
        }

        if (next.startsWith("http")) {
          return NextResponse.redirect(next);
        }

        return NextResponse.redirect(new URL(next, request.url));
      }
      return NextResponse.next();
    }

    if (isProtectedPath(pathname) && !authenticated) {
      const returnPath = `${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(getLoginUrl(request.url, returnPath));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[middleware]", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|webm|wav|ogg|mp4)).*)"],
};

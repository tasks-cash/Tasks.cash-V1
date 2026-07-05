import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";
import { buildMainLoginRedirect } from "@/lib/auth/cookie";
import { verifySessionToken } from "@/lib/auth/jwt";
import { isProtectedPath } from "@/lib/auth/config";
import { LOCALE_COOKIE, defaultLocale } from "@/i18n/config";
import { resolvePreferredLocale, stripLocalePrefix, withLocalePrefix } from "@/i18n/locale-path";

const PUBLIC_API_PREFIXES = ["/api/auth/callback", "/api/auth/logout", "/api/auth/session", "/api/health"];

function shouldSkipLocale(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/image/") ||
    pathname === "/favicon.ico" ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|webm|wav|ogg|mp4)$/.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (shouldSkipLocale(pathname)) {
      if (pathname.startsWith("/api/") && !PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
      }
      if (pathname.startsWith("/api/")) return NextResponse.next();
      return NextResponse.next();
    }

    const preferred = resolvePreferredLocale(
      request.cookies.get(LOCALE_COOKIE)?.value ?? request.cookies.get("tc_locale")?.value
    );

    let { locale, pathname: barePath } = stripLocalePrefix(pathname);

    if (locale === defaultLocale && preferred !== defaultLocale && pathname === barePath) {
      const url = request.nextUrl.clone();
      url.pathname = withLocalePrefix(barePath, preferred);
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set(LOCALE_COOKIE, preferred, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
      return redirect;
    }

    if (isProtectedPath(barePath)) {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (!token || !(await verifySessionToken(token))) {
        const returnUrl = `${request.nextUrl.origin}${withLocalePrefix(`${barePath}${request.nextUrl.search}`, locale)}`;
        return NextResponse.redirect(buildMainLoginRedirect(returnUrl));
      }
    }

    const url = request.nextUrl.clone();
    url.pathname = barePath;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return response;
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

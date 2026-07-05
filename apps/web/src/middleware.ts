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
import { LOCALE_COOKIE, defaultLocale } from "@/i18n/config";
import { resolvePreferredLocale, stripLocalePrefix, withLocalePrefix } from "@/i18n/locale-path";

function readToken(request: NextRequest): string | null {
  return (
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    null
  );
}

function shouldSkipLocale(pathname: string): boolean {
  const { pathname: bare } = stripLocalePrefix(pathname);
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    isPublicLegalPage(bare) ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|webm|wav|ogg|mp4)$/.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (shouldSkipLocale(pathname)) {
      return NextResponse.next();
    }

    const preferred = resolvePreferredLocale(
      request.cookies.get(LOCALE_COOKIE)?.value ?? request.cookies.get("tc_locale")?.value
    );

    let { locale, pathname: barePath } = stripLocalePrefix(pathname);

    // Redirect bare paths to /ar or /fr when preferred (English stays unprefixed)
    if (locale === defaultLocale && preferred !== defaultLocale && pathname === barePath) {
      const url = request.nextUrl.clone();
      url.pathname = withLocalePrefix(barePath, preferred);
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set(LOCALE_COOKIE, preferred, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
      return redirect;
    }

    const token = readToken(request);
    const payload = token ? await verifyAccessToken(token) : null;
    const authenticated = Boolean(payload);

    if (isAuthPage(barePath)) {
      if (authenticated && token) {
        const rawRedirect = request.nextUrl.searchParams.get("redirect");
        const next = buildPostLoginRedirect(rawRedirect, token);
        const pathOnly = next.startsWith("http") ? new URL(next).pathname : next.split("?")[0];
        const bareRedirect = stripLocalePrefix(pathOnly).pathname;

        if (isAuthPage(bareRedirect)) {
          return NextResponse.redirect(new URL(withLocalePrefix(DEFAULT_REDIRECT, locale), request.url));
        }

        if (next.startsWith("http")) {
          return NextResponse.redirect(next);
        }

        return NextResponse.redirect(new URL(withLocalePrefix(next, locale), request.url));
      }

      const url = request.nextUrl.clone();
      url.pathname = barePath;
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-locale", locale);
      const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
      response.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
      return response;
    }

    if (isProtectedPath(barePath) && !authenticated) {
      const returnPath = withLocalePrefix(`${barePath}${request.nextUrl.search}`, locale);
      return NextResponse.redirect(getLoginUrl(request.url, returnPath));
    }

    const url = request.nextUrl.clone();
    url.pathname = barePath;
    const response = NextResponse.rewrite(url);
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) {
    console.error("[middleware]", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|webm|wav|ogg|mp4)).*)"],
};

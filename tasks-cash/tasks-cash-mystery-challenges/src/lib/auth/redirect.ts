import { CHALLENGE_APP_URL, MAIN_APP_URL, ROUTES, trustedExternalOrigins } from "@/config/routes";

export const DEFAULT_REDIRECT = ROUTES.challenge.hub;

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function decodeRedirectParam(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let value = raw.trim();
  if (!value) return null;
  try {
    value = decodeURIComponent(value);
    if (/%[0-9A-Fa-f]{2}/.test(value)) {
      try {
        value = decodeURIComponent(value);
      } catch {
        /* keep single-decoded value */
      }
    }
  } catch {
    return null;
  }
  return value.trim() || null;
}

export function getSafeRedirectUrl(redirect: string | null | undefined): string {
  const decoded = decodeRedirectParam(redirect);
  if (!decoded) return DEFAULT_REDIRECT;

  if (decoded.startsWith("/") && !decoded.startsWith("//")) {
    if (isAuthPath(decoded.split("?")[0])) return DEFAULT_REDIRECT;
    return decoded;
  }

  try {
    const url = new URL(decoded);
    if (trustedExternalOrigins().has(url.origin)) {
      if (isAuthPath(url.pathname)) return DEFAULT_REDIRECT;
      return url.toString();
    }
    const mainOrigin = new URL(MAIN_APP_URL).origin;
    if (url.origin === mainOrigin) {
      if (isAuthPath(url.pathname)) return DEFAULT_REDIRECT;
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return DEFAULT_REDIRECT;
  }

  return DEFAULT_REDIRECT;
}

export function buildMainLoginUrl(returnUrl: string): string {
  const login = new URL("/login", MAIN_APP_URL);
  const safe = getSafeRedirectUrl(returnUrl);
  login.searchParams.set("redirect", safe);
  return login.toString();
}

/** Login URL that returns users to the challenge app hub after auth. */
export function buildChallengeAppLoginUrl(): string {
  const login = new URL("/login", MAIN_APP_URL);
  login.searchParams.set("redirect", CHALLENGE_APP_URL.replace(/\/$/, "") || CHALLENGE_APP_URL);
  return login.toString();
}

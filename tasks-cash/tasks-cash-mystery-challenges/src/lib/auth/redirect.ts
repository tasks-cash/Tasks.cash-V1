export const DEFAULT_REDIRECT = "/dashboard";

const TRUSTED_EXTERNAL_ORIGINS = ["http://localhost:3001", "https://challenge.tasks.cash"] as const;

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";
const CHALLENGE_APP_URL = process.env.NEXT_PUBLIC_CHALLENGE_APP_URL ?? "http://localhost:3001";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

function trustedExternalOrigins(): Set<string> {
  return new Set<string>([...TRUSTED_EXTERNAL_ORIGINS, new URL(CHALLENGE_APP_URL).origin]);
}

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
  if (safe !== DEFAULT_REDIRECT) {
    login.searchParams.set("redirect", safe);
  }
  return login.toString();
}

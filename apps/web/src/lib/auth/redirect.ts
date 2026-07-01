import { AUTH_PAGES, isAuthPage } from "./config";

export const DEFAULT_REDIRECT = "/dashboard";

const TRUSTED_EXTERNAL_ORIGINS = ["http://localhost:3001", "https://challenge.tasks.cash"] as const;

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";
const CHALLENGE_APP_URL = process.env.NEXT_PUBLIC_CHALLENGE_APP_URL ?? "http://localhost:3001";
const MYSTERY_CHALLENGES_URL = process.env.NEXT_PUBLIC_MYSTERY_CHALLENGES_URL ?? CHALLENGE_APP_URL;

function trustedExternalOrigins(): Set<string> {
  const origins = new Set<string>(TRUSTED_EXTERNAL_ORIGINS);
  for (const candidate of [CHALLENGE_APP_URL, MYSTERY_CHALLENGES_URL]) {
    try {
      origins.add(new URL(candidate).origin);
    } catch {
      /* ignore invalid env URL */
    }
  }
  return origins;
}

/** Decode redirect query param safely (supports single or double encoding). */
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

/**
 * Validate redirect target — never auth pages; trusted external origins only.
 * Missing/invalid → /dashboard. /login or /register → /dashboard.
 */
export function getSafeRedirectUrl(redirect: string | null | undefined): string {
  const decoded = decodeRedirectParam(redirect);
  if (!decoded) return DEFAULT_REDIRECT;

  if (decoded.startsWith("/") && !decoded.startsWith("//")) {
    const pathOnly = decoded.split("?")[0];
    if (isAuthPage(pathOnly)) return DEFAULT_REDIRECT;
    return decoded;
  }

  try {
    const url = new URL(decoded);

    if (trustedExternalOrigins().has(url.origin)) {
      if (isAuthPage(url.pathname)) return DEFAULT_REDIRECT;
      return url.toString();
    }

    const mainOrigin = new URL(MAIN_APP_URL).origin;
    if (url.origin === mainOrigin) {
      if (isAuthPage(url.pathname)) return DEFAULT_REDIRECT;
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return DEFAULT_REDIRECT;
  }

  return DEFAULT_REDIRECT;
}

/** Returns null when redirect param is absent or resolves to the default dashboard. */
export function getSafeRedirectTarget(redirect: string | null | undefined): string | null {
  if (!decodeRedirectParam(redirect)) return null;
  const safe = getSafeRedirectUrl(redirect);
  return safe === DEFAULT_REDIRECT ? null : safe;
}

export function shouldPreserveRedirectParam(raw: string | null | undefined): boolean {
  return Boolean(decodeRedirectParam(raw)) && getSafeRedirectUrl(raw) !== DEFAULT_REDIRECT;
}

export function getLoginUrl(requestUrl: string, returnPath: string): string {
  const login = new URL("/login", requestUrl);
  const pathOnly = returnPath.split("?")[0];

  if (isAuthPage(pathOnly)) {
    return login.toString();
  }

  const safe = getSafeRedirectUrl(returnPath);
  if (safe !== DEFAULT_REDIRECT) {
    login.searchParams.set("redirect", safe);
  }

  return login.toString();
}

/** After login, send user to dashboard or challenge callback on localhost cross-port. */
export function buildPostLoginRedirect(redirectParam: string | null | undefined, accessToken: string): string {
  const safe = getSafeRedirectUrl(redirectParam);

  if (!safe.startsWith("http")) {
    return safe;
  }

  const sharedDomain =
    process.env.AUTH_COOKIE_DOMAIN ??
    (process.env.NODE_ENV === "production" ? ".tasks.cash" : undefined);

  if (sharedDomain) {
    return safe;
  }

  const target = new URL(safe);
  const path = `${target.pathname}${target.search}${target.hash}`;
  return `${target.origin}/api/auth/callback?token=${encodeURIComponent(accessToken)}&redirect=${encodeURIComponent(path)}`;
}

export function buildLoginUrl(redirectTarget?: string | null): string {
  const login = new URL("/login", MAIN_APP_URL);
  const safe = getSafeRedirectUrl(redirectTarget ?? null);
  if (safe !== DEFAULT_REDIRECT) {
    login.searchParams.set("redirect", safe);
  }
  return login.toString();
}

/** @deprecated Use isAuthPage from config */
export { AUTH_PAGES };

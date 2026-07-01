import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { buildMainLoginUrl as buildSafeMainLoginUrl } from "./redirect";

export const SESSION_COOKIE_NAME = "tc_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getSessionCookieOptions(): Partial<ResponseCookie> {
  const domain =
    process.env.AUTH_COOKIE_DOMAIN ??
    (process.env.NODE_ENV === "production" ? ".tasks.cash" : undefined);

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    ...(domain ? { domain } : {}),
  };
}

export function getSessionClearCookieOptions(): Partial<ResponseCookie> {
  return { ...getSessionCookieOptions(), maxAge: 0 };
}

export function buildMainLoginRedirect(requestUrl: string): URL {
  return new URL(buildSafeMainLoginUrl(requestUrl));
}

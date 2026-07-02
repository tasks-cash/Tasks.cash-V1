import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

/** HttpOnly session cookie — shared name with API cookie parser */
export const SESSION_COOKIE_NAME = "tasks_cash_token";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Cookie options for localhost + production */
export function getSessionCookieOptions(): Partial<ResponseCookie> {
  const isProd = process.env.NODE_ENV === "production";
  const domain =
    process.env.AUTH_COOKIE_DOMAIN ?? (isProd ? ".tasks.cash" : undefined);

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    ...(domain ? { domain } : {}),
  };
}

export function getSessionClearCookieOptions(): Partial<ResponseCookie> {
  return { ...getSessionCookieOptions(), maxAge: 0 };
}

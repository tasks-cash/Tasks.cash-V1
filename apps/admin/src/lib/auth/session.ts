import { SESSION_COOKIE } from "@/lib/auth/config";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getAdminSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const cookieSecure = process.env.COOKIE_SECURE === "true";
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "";
  return {
    httpOnly: true,
    // Never force Secure on plain HTTP localhost — browsers drop the cookie
    secure: cookieSecure || (isProd && adminUrl.startsWith("https://")),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getAdminSessionClearCookieOptions() {
  return { ...getAdminSessionCookieOptions(), maxAge: 0 };
}

export { SESSION_COOKIE };

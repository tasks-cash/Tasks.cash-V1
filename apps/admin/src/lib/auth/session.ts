import { SESSION_COOKIE } from "@/lib/auth/config";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getAdminSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getAdminSessionClearCookieOptions() {
  return { ...getAdminSessionCookieOptions(), maxAge: 0 };
}

export { SESSION_COOKIE };

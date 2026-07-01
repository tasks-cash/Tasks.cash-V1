import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionClearCookieOptions } from "@/lib/auth/cookie";

/** POST /api/auth/logout — clear challenge session cookie */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionClearCookieOptions());
  return response;
}

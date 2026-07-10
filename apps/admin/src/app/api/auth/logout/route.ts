import { NextResponse } from "next/server";
import { getAdminSessionClearCookieOptions } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/config";

/** POST /api/auth/logout — clear admin session cookie */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set(SESSION_COOKIE, "", getAdminSessionClearCookieOptions());
  return response;
}

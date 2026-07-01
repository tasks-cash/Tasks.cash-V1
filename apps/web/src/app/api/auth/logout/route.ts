import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, getSessionClearCookieOptions } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** POST /api/auth/logout — clear session cookie */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token =
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* stateless JWT — cookie clear is sufficient */
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionClearCookieOptions());
  return response;
}

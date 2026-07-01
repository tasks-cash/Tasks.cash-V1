import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";
import { verifyAccessToken } from "@/lib/auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** POST /api/auth/sync — set httpOnly session cookie from Bearer token (localStorage recovery) */
export async function POST(request: Request) {
  const headerToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const body = await request.json().catch(() => ({}));
  const token = headerToken || (body as { token?: string }).token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }
    const data = await res.json();
    const response = NextResponse.json({ success: true, data: data.data });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch {
    const response = NextResponse.json({ success: true, data: { _id: payload.userId, role: payload.role } });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  }
}

/** GET /api/auth/sync — read session from cookie for client bootstrap */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: { hasSession: true } });
}

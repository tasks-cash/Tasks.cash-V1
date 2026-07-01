import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function attachSessionCookie(response: NextResponse, accessToken?: string) {
  if (accessToken) {
    response.cookies.set(SESSION_COOKIE_NAME, accessToken, getSessionCookieOptions());
  }
  return response;
}

/** POST /api/auth/register — create account and set shared session cookie */
export async function POST(request: Request) {
  const body = await request.text();

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    const response = NextResponse.json(data, { status: res.status });
    if (data.success && data.data?.accessToken) {
      attachSessionCookie(response, data.data.accessToken);
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

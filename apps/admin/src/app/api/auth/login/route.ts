import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { getAdminSessionCookieOptions } from "@/lib/auth/session";
import { API_URL } from "@/config/env";

function normalizeJwt(raw: string): string {
  return raw.replace(/^Bearer\s+/i, "").trim();
}

/** POST /api/auth/login — admin portal login via Admin collection */
export async function POST(request: Request) {
  const body = await request.text();

  try {
    const res = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tc-Admin-Login-Debug": "1" },
      body,
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    const response = NextResponse.json(data, { status: res.status });

    if (data.success && data.data?.accessToken) {
      const token = normalizeJwt(String(data.data.accessToken));
      response.cookies.set(SESSION_COOKIE, token, getAdminSessionCookieOptions());
    }

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

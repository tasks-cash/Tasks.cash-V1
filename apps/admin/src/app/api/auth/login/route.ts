import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { getAdminSessionCookieOptions } from "@/lib/auth/session";
import { API_URL } from "@/config/env";

function normalizeJwt(raw: string): string {
  return raw.replace(/^Bearer\s+/i, "").trim();
}

/** POST /api/auth/login — authenticate through the API and establish the admin session. */
export async function POST(request: Request) {
  const body = await request.text();

  try {
    const apiResponse = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const data = await apiResponse.json().catch(() => ({
      success: false,
      error: "Invalid API response",
    }));
    const response = NextResponse.json(data, { status: apiResponse.status });

    if (data.success && data.data?.accessToken) {
      response.cookies.set(
        SESSION_COOKIE,
        normalizeJwt(String(data.data.accessToken)),
        getAdminSessionCookieOptions()
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "API unavailable" },
      { status: 503 }
    );
  }
}

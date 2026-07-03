import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

import { API_URL } from "@/config/env";

/** GET /api/auth/me — current session user from JWT cookie or Authorization header */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const headerToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const token = headerToken || cookieToken;

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "API request timed out"
        : "API unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

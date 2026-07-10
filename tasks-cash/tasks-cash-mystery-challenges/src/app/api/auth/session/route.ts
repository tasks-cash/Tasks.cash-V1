import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";
import { decodeSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { API_URL } from "@/config/env";

/** GET /api/auth/session — verify cookie and return current user */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const decoded = await decodeSessionToken(token);
  const mePath = decoded?.accountType === "admin" ? "/api/auth/admin/me" : "/api/auth/me";

  try {
    const res = await fetch(`${API_URL}${mePath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

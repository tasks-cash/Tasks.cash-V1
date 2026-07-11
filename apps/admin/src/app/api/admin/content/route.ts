import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

function authHeader(request: Request): string {
  return request.headers.get("Authorization") ?? "";
}

/** GET /api/admin/content — list blocks */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const res = await fetch(`${API_URL}/api/admin/content${url.search}`, {
      headers: { Authorization: authHeader(request) },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

/** POST /api/admin/content — create block */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const res = await fetch(`${API_URL}/api/admin/content`, {
      method: "POST",
      headers: {
        Authorization: authHeader(request),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

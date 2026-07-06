import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

/** Proxy public content API to Express — database is the source of truth. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const appKey = url.searchParams.get("appKey") ?? "challenge";
    const pageKey = url.searchParams.get("pageKey");
    const locale = url.searchParams.get("locale") ?? "en";

    if (!pageKey) {
      return NextResponse.json({ success: false, error: "pageKey is required" }, { status: 400 });
    }

    const params = new URLSearchParams({ appKey, pageKey, locale });
    const res = await fetch(`${API_URL}/api/content?${params}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

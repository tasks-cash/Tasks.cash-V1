import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Proxy public CMS content — always fresh from database. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const appKey = url.searchParams.get("appKey") ?? "main";
    const pageKey = url.searchParams.get("pageKey");
    const locale = url.searchParams.get("locale") ?? "en";

    if (!pageKey) {
      return NextResponse.json({ success: false, error: "pageKey is required" }, { status: 400 });
    }

    const params = new URLSearchParams({ appKey, pageKey, locale });
    const res = await fetch(`${API_URL}/api/content?${params}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

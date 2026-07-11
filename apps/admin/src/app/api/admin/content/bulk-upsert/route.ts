import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

/** POST /api/admin/content/bulk-upsert */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    console.log("[CMS BFF bulk-upsert] forwarding to API");
    const res = await fetch(`${API_URL}/api/admin/content/bulk-upsert`, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") ?? "",
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    console.log("[CMS BFF bulk-upsert] response", { status: res.status, success: data.success, saved: data.saved });
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[CMS BFF bulk-upsert]", err);
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

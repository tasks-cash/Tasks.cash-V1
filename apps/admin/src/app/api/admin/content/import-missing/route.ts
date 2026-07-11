import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const res = await fetch(`${API_URL}/api/admin/content/import-missing`, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") ?? "",
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

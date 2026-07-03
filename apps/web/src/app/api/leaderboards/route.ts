import { NextResponse } from "next/server";

import { API_URL } from "@/config/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const res = await fetch(`${API_URL}/api/leaderboard/public${url.search}`);
    const data = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load leaderboard" }, { status: 503 });
  }
}

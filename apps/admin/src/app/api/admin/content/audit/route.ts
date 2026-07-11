import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

async function proxy(path: string, request: Request, method = "GET") {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: request.headers.get("Authorization") ?? "",
        "Content-Type": "application/json",
      },
      body: method === "GET" || method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

export async function GET(request: Request) {
  return proxy("/api/admin/content/audit", request);
}

import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ProxyOptions = {
  method?: string;
};

/** Proxy to Express API — no mock/runtime fallback data. */
export async function proxyRequest(
  apiPath: string,
  request: Request,
  options?: ProxyOptions
): Promise<NextResponse> {
  try {
    const method = options?.method ?? request.method;
    const headers: Record<string, string> = {
      Authorization: request.headers.get("Authorization") ?? "",
    };

    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      body = await request.text();
    }

    const url = new URL(request.url);
    const res = await fetch(`${API_URL}${apiPath}${url.search}`, { method, headers, body });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

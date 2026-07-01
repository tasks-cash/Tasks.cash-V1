import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ProxyOptions = {
  method?: string;
};

function resolveAuthorization(request: Request): string {
  const direct = request.headers.get("Authorization");
  if (direct) return direct;

  const cookie = request.headers.get("Cookie");
  if (!cookie) return "";

  const match = cookie.match(/(?:^|;\s*)tc_session=([^;]+)/);
  if (!match) return "";

  return `Bearer ${decodeURIComponent(match[1])}`;
}

/** Proxy to Express API — no mock/runtime fallback data. */
export async function proxyRequest(
  apiPath: string,
  request: Request,
  options?: ProxyOptions
): Promise<NextResponse> {
  try {
    const method = options?.method ?? request.method;
    const headers: Record<string, string> = {
      Authorization: resolveAuthorization(request),
      Cookie: request.headers.get("Cookie") ?? "",
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

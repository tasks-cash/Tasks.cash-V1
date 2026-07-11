import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

type ProxyOptions = {
  method?: string;
};

function resolveAuthorization(request: Request): string {
  const direct = request.headers.get("Authorization");
  if (direct) return direct;

  const cookie = request.headers.get("Cookie");
  if (!cookie) return "";

  const match = cookie.match(/(?:^|;\s*)tasks_cash_token=([^;]+)/);
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

    // Never double-append search: callers may pass apiPath with or without query.
    const incoming = new URL(request.url);
    const target = new URL(apiPath, API_URL.endsWith("/") ? API_URL : `${API_URL}/`);
    if (!apiPath.includes("?")) {
      incoming.searchParams.forEach((value, key) => {
        target.searchParams.set(key, value);
      });
    }

    const res = await fetch(target.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

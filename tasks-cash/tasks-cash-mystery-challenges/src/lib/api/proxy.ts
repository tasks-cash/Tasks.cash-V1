import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/session-user";
import { API_URL } from "@/config/env";

/** Proxy authenticated requests to the main Tasks.cash API */
export async function proxyToMainApi(
  apiPath: string,
  request: Request,
  options?: { method?: string; body?: string }
): Promise<NextResponse> {
  const token = await getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const method = options?.method ?? request.method;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Cookie: request.headers.get("Cookie") ?? "",
    };

    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      body = options?.body ?? (await request.text());
    }

    const url = new URL(request.url);
    const res = await fetch(`${API_URL}${apiPath}${url.search}`, { method, headers, body });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

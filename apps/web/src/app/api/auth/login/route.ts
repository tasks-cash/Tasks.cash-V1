import { DEV_MOCK_AUTH, proxyRequest } from "@/lib/proxy";

/** Proxy to Express API — auth/login */
export async function GET(request: Request) {
  return proxyRequest("/api/auth/login", request, { fallback: { success: false, error: "API unavailable" } });
}

export async function POST(request: Request) {
  return proxyRequest("/api/auth/login", request, { fallback: DEV_MOCK_AUTH });
}

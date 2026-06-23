import { DEV_MOCK_AUTH, proxyRequest } from "@/lib/proxy";

/** Proxy to Express API — auth/register */
export async function GET(request: Request) {
  return proxyRequest("/api/auth/register", request);
}

export async function POST(request: Request) {
  return proxyRequest("/api/auth/register", request, { fallback: DEV_MOCK_AUTH });
}

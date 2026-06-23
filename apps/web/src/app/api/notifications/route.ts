import { proxyRequest } from "@/lib/proxy";

/** Proxy to Express API — notifications */
export async function GET(request: Request) {
  return proxyRequest("/api/notifications", request, {
    fallback: { success: true, data: [] },
  });
}

export async function POST(request: Request) {
  return proxyRequest("/api/notifications", request);
}

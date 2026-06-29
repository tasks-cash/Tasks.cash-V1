import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_REWARDS } from "@/lib/dev-mocks/rewards";

/** Proxy to Express API — rewards */
export async function GET(request: Request) {
  return proxyRequest("/api/rewards", request, {
    fallback: { success: true, data: DEV_MOCK_REWARDS },
  });
}

export async function POST(request: Request) {
  return proxyRequest("/api/rewards", request);
}

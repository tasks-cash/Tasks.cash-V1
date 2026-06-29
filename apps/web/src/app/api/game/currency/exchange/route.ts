import { proxyRequest } from "@/lib/proxy";

/** Proxy to Express API — game/currency/exchange */
export async function POST(request: Request) {
  return proxyRequest("/api/game/currency/exchange", request, {
    fallback: { success: true, message: "Exchange simulated (offline mode)" },
  });
}

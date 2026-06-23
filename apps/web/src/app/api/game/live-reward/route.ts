import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/game/live-reward", request, {
    fallback: { success: false, error: "API unavailable" },
  });
}

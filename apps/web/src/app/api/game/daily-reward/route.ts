import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/game/daily-reward", request, { method: "POST" });
}

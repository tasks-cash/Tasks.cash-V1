import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/game/dashboard", request, {
    fallback: { success: true, data: null },
  });
}

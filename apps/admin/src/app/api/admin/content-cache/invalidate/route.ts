import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/admin/content-cache/invalidate", request, { method: "POST" });
}

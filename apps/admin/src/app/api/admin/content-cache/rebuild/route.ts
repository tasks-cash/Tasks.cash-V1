import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/admin/content-cache/rebuild", request, { method: "POST" });
}

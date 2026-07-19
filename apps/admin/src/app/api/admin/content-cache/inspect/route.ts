import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyRequest(`/api/admin/content-cache/inspect${url.search}`, request);
}

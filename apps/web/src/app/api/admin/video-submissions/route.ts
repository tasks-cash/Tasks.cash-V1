import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/admin/video-submissions", request);
}

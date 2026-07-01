import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/video-submissions", request);
}

export async function POST(request: Request) {
  return proxyRequest("/api/video-submissions", request, { method: "POST" });
}

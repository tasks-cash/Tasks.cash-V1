import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/support", request);
}

export async function POST(request: Request) {
  return proxyRequest("/api/support", request, { method: "POST" });
}

import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/users/dashboard", request);
}

export async function POST(request: Request) {
  return proxyRequest("/api/users/dashboard", request, { method: "POST" });
}

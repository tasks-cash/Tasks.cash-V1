import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/withdrawals", request);
}

export async function POST(request: Request) {
  return proxyRequest("/api/withdrawals", request, { method: "POST" });
}

import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest("/api/referrals/history", request);
}

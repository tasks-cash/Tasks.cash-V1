import { proxyToMainApi } from "@/lib/api/proxy";

export async function GET(request: Request) {
  return proxyToMainApi("/api/referrals/history", request);
}

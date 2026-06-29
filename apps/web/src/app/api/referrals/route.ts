import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_REFERRAL_ME } from "@/lib/dev-mocks/referrals";

/** Proxy to Express API — referrals (legacy + me stats) */
export async function GET(request: Request) {
  return proxyRequest("/api/referrals/me", request, {
    fallback: { success: true, data: DEV_MOCK_REFERRAL_ME },
  });
}

export async function POST(request: Request) {
  return proxyRequest("/api/referrals/validate-code", request);
}

import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_REFERRAL_ME } from "@/lib/dev-mocks/referrals";

export async function GET(request: Request) {
  return proxyRequest("/api/admin/referrals", request, {
    fallback: { success: true, data: DEV_MOCK_REFERRAL_ME.history },
  });
}

import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_EXPLORER_DNA } from "@/lib/dev-mocks/explorer-dna";

export async function GET(request: Request) {
  return proxyRequest("/api/explorer-dna/me", request, {
    fallback: { success: true, data: DEV_MOCK_EXPLORER_DNA },
  });
}

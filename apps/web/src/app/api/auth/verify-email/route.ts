import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/auth/verify-email", request, {
    fallback: { success: true, data: { verified: true } },
  });
}

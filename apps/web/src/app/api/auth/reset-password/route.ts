import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/auth/reset-password", request, {
    fallback: { success: true, data: { message: "Password updated." } },
  });
}

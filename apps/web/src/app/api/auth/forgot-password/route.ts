import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/auth/forgot-password", request, {
    fallback: { success: true, data: { message: "If the email exists, a reset link was sent." } },
  });
}

import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/auth/verify-email", request, { method: "POST" });
}

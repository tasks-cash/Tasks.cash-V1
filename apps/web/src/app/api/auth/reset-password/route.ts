import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest("/api/auth/reset-password", request, { method: "POST" });
}

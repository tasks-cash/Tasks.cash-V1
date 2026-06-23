import { proxyRequest } from "@/lib/proxy";

/** Proxy — notifications unread count */
export async function GET(request: Request) {
  return proxyRequest("/api/notifications/unread-count", request, {
    fallback: { success: true, data: { count: 0 } },
  });
}

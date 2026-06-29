import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_VIDEO_SUBMISSIONS } from "@/lib/dev-mocks/video-submissions";

/** Proxy to Express API — admin/video-submissions list */
export async function GET(request: Request) {
  return proxyRequest("/api/admin/video-submissions", request, {
    fallback: { success: true, data: DEV_MOCK_VIDEO_SUBMISSIONS },
  });
}

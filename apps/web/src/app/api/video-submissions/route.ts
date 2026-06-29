import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_VIDEO_SUBMISSIONS } from "@/lib/dev-mocks/video-submissions";

export async function GET(request: Request) {
  return proxyRequest("/api/video-submissions", request, {
    fallback: { success: true, data: DEV_MOCK_VIDEO_SUBMISSIONS },
  });
}

export async function POST(request: Request) {
  return proxyRequest("/api/video-submissions", request);
}

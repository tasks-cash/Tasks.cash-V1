import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(`/api/video-submissions/${id}`, request);
}

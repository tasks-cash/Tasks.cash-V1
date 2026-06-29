import { proxyRequest } from "@/lib/proxy";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(`/api/admin/referrals/${id}/status`, request, { method: "PATCH" });
}

import { proxyRequest } from "@/lib/proxy";
import { DEV_MOCK_REWARDS } from "@/lib/dev-mocks/rewards";

/** Proxy to Express API — rewards/:id/claim */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(`/api/rewards/${id}/claim`, request, {
    method: "POST",
    fallback: {
      success: true,
      data: {
        reward: DEV_MOCK_REWARDS.find((r) => r._id === id) ?? DEV_MOCK_REWARDS[0],
        message: "Reward claimed (offline mode)",
      },
    },
  });
}

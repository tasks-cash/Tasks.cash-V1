import { proxyRequest } from "@/lib/proxy";

/** Proxy to Express API — users/dashboard */
export async function GET(request: Request) {
  return proxyRequest("/api/users/dashboard", request, {
    fallback: {
      success: true,
      data: {
        coins: 2450,
        xp: 6500,
        level: 12,
        levelTitle: "Void Walker",
        xpToNextLevel: 10000,
        xpProgress: 65,
        completedMissions: 34,
        rank: 128,
        referralCount: 12,
        referralCode: "VOID-7X9K",
      },
    },
  });
}

export async function POST(request: Request) {
  return proxyRequest("/api/users/dashboard", request);
}

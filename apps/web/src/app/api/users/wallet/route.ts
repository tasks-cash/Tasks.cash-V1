import { proxyRequest } from "@/lib/proxy";

const WALLET_FALLBACK = {
  success: true,
  data: {
    balance: 2450,
    currencies: {
      bronze: 2450,
      silver: 120,
      gold: 15,
      diamonds: 8,
      crystals: 24,
      legendTokens: 2,
      mythicCoins: 0,
      portalEnergy: 85,
    },
    transactions: [],
  },
};

/** Proxy to Express API — users/wallet */
export async function GET(request: Request) {
  return proxyRequest("/api/users/wallet", request, { fallback: WALLET_FALLBACK });
}

import { APP_URL } from "../config/env";

export function buildReferralLink(code: string) {
  return `${APP_URL}/register?ref=${encodeURIComponent(code)}`;
}

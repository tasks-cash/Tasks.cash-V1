function appBaseUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function buildReferralLink(code: string) {
  return `${appBaseUrl()}/register?ref=${encodeURIComponent(code)}`;
}

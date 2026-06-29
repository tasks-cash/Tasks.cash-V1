import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function mockValidate(code: string, selfReferralCode?: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Referral code is required" };
  if (selfReferralCode && normalized === selfReferralCode.toUpperCase()) {
    return { valid: false, error: "You cannot use your own referral code" };
  }
  if (normalized === "VOID-7X9K") {
    return { valid: true, code: normalized, referrerUsername: "VoidHunter" };
  }
  return { valid: false, error: "Invalid referral code" };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "");
  const selfReferralCode = body.selfReferralCode ? String(body.selfReferralCode) : undefined;

  try {
    const res = await fetch(`${API_URL}/api/referrals/validate-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, selfReferralCode }),
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: true, data: mockValidate(code, selfReferralCode) });
  }
}

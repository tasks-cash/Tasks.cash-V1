import { NextResponse } from "next/server";

import { API_URL } from "@/config/env";

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
    return NextResponse.json({ success: false, error: "Referral validation unavailable" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  try {
    return proxyRequest("/api/explorer-dna/answers", request);
  } catch {
    const body = await request.json().catch(() => ({}));
    const { questionId, value } = body as { questionId?: string; value?: unknown };
    if (!questionId || value === undefined) {
      return NextResponse.json({ success: false, message: "questionId and value required" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      data: {
        answerId: `ans_dev_${questionId}`,
        questionId,
        value,
        xpAwarded: 50,
        coinsAwarded: 25,
        completionDelta: 1,
        intelligenceDelta: 12,
      },
    });
  }
}

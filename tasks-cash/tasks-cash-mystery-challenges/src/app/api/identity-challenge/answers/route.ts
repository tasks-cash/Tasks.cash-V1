import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-user";
import { submitIdentityAnswer } from "@/lib/server/identity-challenge-service";

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** POST /api/identity-challenge/answers — save answer and claim reward once per question */
export async function POST(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return unauthorized();

  try {
    const body = (await request.json()) as { questionId?: string; answer?: string };
    if (!body.questionId?.trim()) return fail("questionId is required");
    if (!body.answer?.trim()) return fail("answer is required");

    const data = await submitIdentityAnswer(session.userId, body.questionId.trim(), body.answer);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save answer";
    console.error("[identity-challenge/answers POST]", err);
    if (message === "Question not found") return fail(message, 404);
    if (message === "Database unavailable") return fail(message, 503);
    return fail(message, 400);
  }
}

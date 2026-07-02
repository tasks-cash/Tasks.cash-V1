import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-user";
import { getIdentityChallengeForUser } from "@/lib/server/identity-challenge-service";

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

/** GET /api/identity-challenge/questions — active questions + user progress from database */
export async function GET(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return unauthorized();

  try {
    const data = await getIdentityChallengeForUser(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load identity questions";
    console.error("[identity-challenge/questions GET]", err);
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

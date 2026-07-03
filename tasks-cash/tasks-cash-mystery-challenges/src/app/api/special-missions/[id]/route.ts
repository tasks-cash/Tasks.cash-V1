import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-user";
import { getSpecialMissionById } from "@/lib/server/special-mission-service";

/** GET /api/special-missions/:id */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getSessionUser(request);
    const data = await getSpecialMissionById(id, session?.userId);
    if (!data) {
      return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[special-missions GET :id]", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-user";
import { createSpecialMission, listSpecialMissions } from "@/lib/server/special-mission-service";

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** GET /api/special-missions — load missions from database */
export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    const data = await listSpecialMissions();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[special-missions GET]", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }
}

/** POST /api/special-missions — create mission in database */
export async function POST(request: Request) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      category?: string;
      requiredProof?: string;
      rewardXp?: number;
      bronzeCoins?: number;
      silverCoins?: number;
      goldCoins?: number;
      deadline?: string;
      status?: string;
      difficulty?: string;
      isActive?: boolean;
    };

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "").trim();
    const requiredProof = String(body.requiredProof ?? "").trim();
    const deadline = String(body.deadline ?? "").trim();

    if (!title) return fail("title is required");
    if (!description) return fail("description is required");
    if (!category) return fail("category is required");
    if (!requiredProof) return fail("requiredProof is required");
    if (!deadline || Number.isNaN(Date.parse(deadline))) return fail("valid deadline is required");

    const mission = await createSpecialMission({
      title,
      description,
      category,
      requiredProof,
      rewardXp: Number(body.rewardXp) || 0,
      bronzeCoins: Number(body.bronzeCoins) || 0,
      silverCoins: Number(body.silverCoins) || 0,
      goldCoins: Number(body.goldCoins) || 0,
      deadline,
      status: body.status as "open" | "in_progress" | "closed" | "archived" | undefined,
      difficulty: body.difficulty as "Easy" | "Medium" | "Hard" | "Epic" | "Legendary" | undefined,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ success: true, data: mission }, { status: 201 });
  } catch (err) {
    console.error("[special-missions POST]", err);
    return NextResponse.json({ success: false, error: "Failed to create mission" }, { status: 500 });
  }
}

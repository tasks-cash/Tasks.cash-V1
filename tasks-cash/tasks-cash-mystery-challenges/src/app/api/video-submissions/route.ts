import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-user";
import { createVideoSubmission, listUserVideoSubmissions } from "@/lib/server/video-submission-service";
import { detectPlatformFromUrl, parseViewsInput } from "@/lib/video-hunter/platform";

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** GET /api/video-submissions — current user's submissions from database */
export async function GET(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return unauthorized();

  try {
    const data = await listUserVideoSubmissions(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[video-submissions GET]", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }
}

/** POST /api/video-submissions — save new submission to database */
export async function POST(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return unauthorized();

  try {
    const body = (await request.json()) as {
      videoUrl?: string;
      visibleViews?: string | number;
      ideaTitle?: string;
      description?: string;
      platform?: string;
    };

    const videoUrl = String(body.videoUrl ?? "").trim();
    const ideaTitle = String(body.ideaTitle ?? "").trim();
    const description = String(body.description ?? "").trim();
    const visibleViews = parseViewsInput(String(body.visibleViews ?? "0"));
    const platform = body.platform?.trim() || detectPlatformFromUrl(videoUrl) || "Unknown";

    if (!videoUrl) return fail("videoUrl is required");
    if (!ideaTitle) return fail("ideaTitle is required");
    if (!description) return fail("description is required");
    if (visibleViews <= 0) return fail("visibleViews must be greater than 0");

    const submission = await createVideoSubmission(session.userId, {
      videoUrl,
      visibleViews,
      ideaTitle,
      description,
      platform,
    });

    const data = await listUserVideoSubmissions(session.userId);
    return NextResponse.json({ success: true, data: { submission, ...data } }, { status: 201 });
  } catch (err) {
    console.error("[video-submissions POST]", err);
    return NextResponse.json({ success: false, error: "Failed to save video submission" }, { status: 500 });
  }
}

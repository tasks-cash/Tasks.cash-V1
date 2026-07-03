import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-user";
import { submitSpecialMissionProof } from "@/lib/server/special-mission-service";

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** POST /api/special-missions/:id/submit-proof */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const proofFile = form.get("proofFile");
      const result = await submitSpecialMissionProof(id, session.userId, {
        proofText: String(form.get("proofText") ?? "").trim() || undefined,
        proofUrl: String(form.get("proofUrl") ?? "").trim() || undefined,
        userNote: String(form.get("userNote") ?? "").trim() || undefined,
        proofFile: proofFile instanceof File && proofFile.size > 0 ? proofFile : null,
      });
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    const body = (await request.json()) as {
      proofText?: string;
      proofUrl?: string;
      userNote?: string;
    };

    const result = await submitSpecialMissionProof(id, session.userId, {
      proofText: String(body.proofText ?? "").trim() || undefined,
      proofUrl: String(body.proofUrl ?? "").trim() || undefined,
      userNote: String(body.userNote ?? "").trim() || undefined,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit proof";
    const status = message === "Mission not found" ? 404 : 400;
    console.error("[special-missions submit-proof]", err);
    return fail(message, status);
  }
}

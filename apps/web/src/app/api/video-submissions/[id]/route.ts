import { NextResponse } from "next/server";
import { DEV_MOCK_VIDEO_SUBMISSIONS } from "@/lib/dev-mocks/video-submissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/api/video-submissions/${id}`, {
      headers: { Authorization: request.headers.get("Authorization") ?? "" },
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    const item = DEV_MOCK_VIDEO_SUBMISSIONS.find((v) => v.id === id);
    if (!item) return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  }
}

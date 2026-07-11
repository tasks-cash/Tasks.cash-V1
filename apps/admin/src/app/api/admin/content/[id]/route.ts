import { NextResponse } from "next/server";
import { API_URL } from "@/config/env";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/content/:id */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id || id === "undefined") {
      return NextResponse.json({ success: false, error: "Valid content block id is required" }, { status: 400 });
    }
    const body = await request.text();
    const res = await fetch(`${API_URL}/api/admin/content/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: request.headers.get("Authorization") ?? "",
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

/** DELETE /api/admin/content/:id */
export async function DELETE(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const res = await fetch(`${API_URL}/api/admin/content/${id}`, {
      method: "DELETE",
      headers: { Authorization: request.headers.get("Authorization") ?? "" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid API response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "API unavailable" }, { status: 503 });
  }
}

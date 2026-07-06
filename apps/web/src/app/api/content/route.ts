import { NextResponse } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appKey = url.searchParams.get("appKey") ?? "main";
  const pageKey = url.searchParams.get("pageKey");
  const locale = url.searchParams.get("locale") ?? "en";

  if (!pageKey) {
    return NextResponse.json({ success: false, error: "pageKey is required" }, { status: 400 });
  }

  const params = new URLSearchParams({ appKey, pageKey, locale });
  return proxyRequest(`/api/content?${params}`, request);
}

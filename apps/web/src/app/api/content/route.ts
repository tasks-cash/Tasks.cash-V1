import { NextResponse } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageKey = url.searchParams.get("pageKey");
  const locale = url.searchParams.get("locale") ?? "en";

  if (!pageKey) {
    return NextResponse.json({ success: false, error: "pageKey is required" }, { status: 400 });
  }

  return proxyRequest(
    `/api/content?pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`,
    request
  );
}

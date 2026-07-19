import { NextResponse } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyRequest(`/api/admin/content-cache/config${url.search}`, request);
}

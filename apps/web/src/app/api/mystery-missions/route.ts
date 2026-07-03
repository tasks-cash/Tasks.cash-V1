import { NextResponse } from "next/server";

import { API_URL } from "@/config/env";

/** Proxy to Express API — mystery missions */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = await fetch(`${API_URL}/api/mystery-missions${url.search}`, {
    headers: { Authorization: request.headers.get("Authorization") ?? "" },
  });
  return NextResponse.json(await res.json());
}

import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Proxy to Express API — mystery missions */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = await fetch(`${API_URL}/api/mystery-missions${url.search}`, {
    headers: { Authorization: request.headers.get("Authorization") ?? "" },
  });
  return NextResponse.json(await res.json());
}

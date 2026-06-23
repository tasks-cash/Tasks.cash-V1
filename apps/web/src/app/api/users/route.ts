import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Proxy to Express API — users */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = await fetch(`${API_URL}/api/users${url.search}`, {
    headers: { Authorization: request.headers.get("Authorization") ?? "" },
  });
  return NextResponse.json(await res.json());
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: request.headers.get("Authorization") ?? "",
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}

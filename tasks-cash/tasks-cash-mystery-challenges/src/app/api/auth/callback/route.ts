import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  buildMainLoginRedirect,
  getSessionCookieOptions,
} from "@/lib/auth/cookie";
import { verifySessionToken } from "@/lib/auth/jwt";

/** Receive JWT from main app after login and set challenge-app session cookie */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.redirect(buildMainLoginRedirect(url.origin));
  }

  const response = NextResponse.redirect(new URL("/", url.origin));
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}

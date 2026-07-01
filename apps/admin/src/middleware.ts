import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Admin app uses localStorage token — middleware cannot read it. Allow all page routes. */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)"],
};

import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function decodeSessionToken(token: string): Promise<{ userId: string; role?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId, role: typeof payload.role === "string" ? payload.role : undefined };
  } catch {
    return null;
  }
}

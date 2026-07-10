import { jwtVerify } from "jose";

export type AccountType = "user" | "admin";

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

export async function decodeSessionToken(
  token: string
): Promise<{ userId: string; role?: string; accountType?: AccountType } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.userId !== "string") return null;
    const accountType =
      payload.accountType === "admin" || payload.accountType === "user"
        ? payload.accountType
        : "user";
    return {
      userId: payload.userId,
      role: typeof payload.role === "string" ? payload.role : undefined,
      accountType,
    };
  } catch {
    return null;
  }
}

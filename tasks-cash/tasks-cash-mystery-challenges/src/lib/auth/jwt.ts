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

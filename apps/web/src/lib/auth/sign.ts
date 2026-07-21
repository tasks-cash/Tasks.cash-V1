import { SignJWT } from "jose";

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
}

/** Sign JWT compatible with Express jsonwebtoken verification (HS256). */
export async function signAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

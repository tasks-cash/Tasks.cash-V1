import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
export function requestCanonical(input: { method: string; path: string; timestamp: number; nonce: string; body: unknown }): string {
  const bodyHash = createHash("sha256").update(JSON.stringify(input.body ?? {})).digest("hex");
  return [input.method.toUpperCase(), input.path, String(input.timestamp), input.nonce, bodyHash].join("\n");
}
export const signRequest = (secret: string, input: Parameters<typeof requestCanonical>[0]) =>
  createHmac("sha256", secret).update(requestCanonical(input)).digest("hex");
export const callbackCanonical = (timestamp: number, rawBody: string) => `${timestamp}.${rawBody}`;
export const signCallback = (secret: string, timestamp: number, rawBody: string) =>
  createHmac("sha256", secret).update(callbackCanonical(timestamp, rawBody)).digest("hex");
export const secureNonce = () => randomBytes(24).toString("hex");
export const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

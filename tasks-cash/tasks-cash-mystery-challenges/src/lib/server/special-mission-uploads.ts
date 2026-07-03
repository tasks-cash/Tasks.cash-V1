import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const PROOF_DIR = path.join(process.cwd(), "public/uploads/special-missions/proofs");

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const EXT_MAP: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
};

const MAX_BYTES = 5 * 1024 * 1024;

export async function ensureProofUploadDir(): Promise<void> {
  await fs.mkdir(PROOF_DIR, { recursive: true });
}

export async function saveProofFile(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_BYTES) {
    return { error: "Proof file must be 5MB or smaller." };
  }

  const ext = EXT_MAP[file.type];
  if (!ext && !file.name.match(/\.(png|jpe?g|webp|pdf|txt)$/i)) {
    return { error: "Proof file must be PNG, JPEG, WEBP, PDF, or TXT." };
  }

  const resolvedExt = ext ?? (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".bin");
  await ensureProofUploadDir();
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${resolvedExt}`;
  const diskPath = path.join(PROOF_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(diskPath, buffer);

  return { url: `/uploads/special-missions/proofs/${filename}` };
}

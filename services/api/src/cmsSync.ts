import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { ContentBlock } from "./models/ContentBlock";
import {
  auditContentBlocks,
  detectDuplicateSeedKeys,
  importMissingContent,
  syncContentDefaults,
} from "./lib/contentAudit";
import { CONTENT_SEED_ROWS } from "./data/contentSeed";
import { CMS_PAGES, CMS_WIRED_PAGES } from "./data/contentPagesRegistry";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
// Prefer localhost when running sync from host against dockerized Mongo
if (process.env.MONGODB_URI?.includes("mongodb://mongodb:")) {
  process.env.MONGODB_URI = process.env.MONGODB_URI.replace(
    "mongodb://mongodb:",
    "mongodb://127.0.0.1:"
  );
}

const EXPECTED_UNIQUE_KEYS = ["appKey", "pageKey", "sectionKey", "contentKey", "locale"];

const SCAN_ROOTS = [
  path.resolve(__dirname, "../../../apps/web/src"),
  path.resolve(__dirname, "../../../apps/admin/src"),
  path.resolve(__dirname, "../../../tasks-cash/tasks-cash-mystery-challenges/src"),
  path.resolve(__dirname, "../../../packages/ui/src"),
];

function walkTsxFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
      walkTsxFiles(full, out);
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Heuristic: quoted strings that look user-facing (not classNames / imports). */
function detectHardcodedStrings(filePath: string): { file: string; line: number; text: string }[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const hits: { file: string; line: number; text: string }[] = [];
  const rel = path.relative(path.resolve(__dirname, "../../.."), filePath);

  // Skip if file already uses useContent / getText / text(
  const usesCms = /useContent\(|getText\(|\btext\(/.test(content);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/className=|import |from |console\.|\/\/|^\s*\*|href=|src=|api\/|process\.env/.test(line)) {
      continue;
    }
    // JSX text or string props that look like copy
    const matches = line.matchAll(/(?:>|^|[^=])\s*["'`]([A-Z][^"'`]{8,120})["'`]/g);
    for (const m of matches) {
      const text = m[1].trim();
      if (/^(http|https|Bearer|Content-Type|application\/)/i.test(text)) continue;
      if (/^[A-Z_]+$/.test(text)) continue;
      hits.push({ file: rel, line: i + 1, text: text.slice(0, 80) });
    }
  }

  // Prefer reporting files that are not CMS-wired
  if (usesCms && hits.length > 40) return hits.slice(0, 5);
  return hits.slice(0, 15);
}

async function ensureContentIndexes() {
  const collection = ContentBlock.collection;
  const indexes = await collection.indexes();

  for (const idx of indexes) {
    const name = idx.name;
    if (!name || name === "_id_") continue;

    const keys = Object.keys(idx.key ?? {});
    const matchesCurrent =
      keys.length === EXPECTED_UNIQUE_KEYS.length &&
      EXPECTED_UNIQUE_KEYS.every((k) => keys.includes(k));

    if (idx.unique && !matchesCurrent) {
      await collection.dropIndex(name);
      console.log(`[cms:sync] Dropped legacy index: ${name}`);
    }
  }

  await ContentBlock.syncIndexes();
}

async function cmsSync() {
  console.log("══════════════════════════════════════════");
  console.log("  Tasks.cash CMS Sync");
  console.log("══════════════════════════════════════════\n");

  // 1. Scan files
  const scannedFiles: string[] = [];
  for (const root of SCAN_ROOTS) {
    walkTsxFiles(root, scannedFiles);
  }
  console.log(`[scan] Files scanned: ${scannedFiles.length}`);

  const hardcoded: { file: string; line: number; text: string }[] = [];
  for (const file of scannedFiles) {
    hardcoded.push(...detectHardcodedStrings(file));
  }
  console.log(`[scan] Heuristic user-facing string hits: ${hardcoded.length}`);

  // 2. Seed inventory stats
  const uniqueLogical = new Set(
    CONTENT_SEED_ROWS.map((r) => `${r.appKey}::${r.pageKey}::${r.sectionKey}::${r.contentKey}`)
  );
  console.log(`[seed] Seed rows (all locales): ${CONTENT_SEED_ROWS.length}`);
  console.log(`[seed] Unique logical keys: ${uniqueLogical.size}`);
  const dupes = detectDuplicateSeedKeys();
  console.log(`[seed] Invalid duplicate composite keys: ${dupes.length}`);
  if (dupes.length > 0) {
    console.log(dupes.slice(0, 10).map((d) => `  - ${d}`).join("\n"));
  }

  // 3. Registry coverage
  let totalPages = 0;
  let wiredPages = 0;
  for (const [app, pages] of Object.entries(CMS_PAGES)) {
    const wired = new Set(CMS_WIRED_PAGES[app as keyof typeof CMS_WIRED_PAGES] ?? []);
    totalPages += pages.length;
    for (const p of pages) {
      if (wired.has(p.key)) wiredPages += 1;
      else console.log(`[registry] Unwired: ${app}/${p.key}`);
    }
  }
  console.log(`[registry] Pages: ${wiredPages}/${totalPages} connected to CMS`);

  // 4. Database sync
  await connectDatabase();
  await ensureContentIndexes();

  const imported = await importMissingContent();
  console.log(
    `[import] Inserted: ${imported.created} | Existing skipped: ${imported.skipped} | Failed: ${imported.failed}`
  );

  const synced = await syncContentDefaults();
  console.log(
    `[defaults] Updated defaults: ${synced.defaultsUpdated} | Values synced (untouched): ${synced.valuesSyncedFromDefault} | Unchanged: ${synced.unchanged}`
  );

  try {
    const { connectRedis } = await import("./config/redis");
    const { invalidateAfterCmsMutation } = await import("./services/contentCacheInvalidation");
    await connectRedis();
    const affected = [...imported.affected, ...synced.affected];
    if (affected.length > 0) {
      const results = await invalidateAfterCmsMutation(affected);
      const keys = results.reduce((n, r) => n + r.keysInvalidated, 0);
      console.log(`[cache] Invalidated ${keys} page-cache key(s) after sync`);
    }
  } catch (err) {
    console.warn("[cache] invalidation skipped:", err instanceof Error ? err.message : err);
  }

  const audit = await auditContentBlocks();
  console.log(`\n── Audit Summary ──`);
  console.log(`  Seed keys:           ${audit.seedKeyCount}`);
  console.log(`  DB keys:             ${audit.dbKeyCount}`);
  console.log(`  Missing keys:        ${audit.missingKeys.length}`);
  console.log(`  Missing EN/AR/FR:    ${audit.missingEn}/${audit.missingAr}/${audit.missingFr}`);
  console.log(`  Translation gaps:    ${audit.translationGaps.length}`);
  console.log(`  Translation req'd:   ${audit.translationRequiredCount ?? 0}`);
  console.log(`  Completeness:        ${audit.translationCompletenessPercent ?? 0}%`);
  console.log(`  Connected pages:     ${audit.connectedPages}/${audit.totalPages}`);
  console.log(`  Unwired pages:       ${audit.unwiredPages.length}`);
  console.log(`  Duplicate keys:      ${(audit.duplicateKeys ?? []).length}`);

  if (audit.missingKeys.length > 0) {
    console.log(`\n── Missing keys (first 20) ──`);
    for (const k of audit.missingKeys.slice(0, 20)) {
      console.log(`  ${k.appKey}/${k.pageKey} · ${k.sectionKey}.${k.contentKey} [${k.locale}]`);
    }
  }

  if (hardcoded.length > 0) {
    console.log(`\n── Remaining hardcoded candidates (first 40) ──`);
    for (const h of hardcoded.slice(0, 40)) {
      console.log(`  ${h.file}:${h.line} — "${h.text}"`);
    }
    if (hardcoded.length > 40) console.log(`  … +${hardcoded.length - 40} more`);
  }

  console.log("\n[cms:sync] Done.");
  await disconnectDatabase();
  if (imported.failed > 0) process.exit(1);
}

cmsSync().catch((err) => {
  console.error("[cms:sync] Failed:", err);
  process.exit(1);
});

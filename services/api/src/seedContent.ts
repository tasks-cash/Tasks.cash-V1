import dotenv from "dotenv";
import path from "path";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { ContentBlock } from "./models/ContentBlock";
import { CONTENT_SEED_ROWS } from "./data/contentSeed";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const EXPECTED_UNIQUE_KEYS = ["appKey", "pageKey", "sectionKey", "contentKey", "locale"];

/** Drop legacy unique indexes from older CMS schema (pageKey+locale+contentKey only). */
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
      console.log(`[seed:content] Dropped legacy index: ${name}`);
    }
  }

  await ContentBlock.syncIndexes();
}

async function seedContent() {
  await connectDatabase();
  await ensureContentIndexes();

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of CONTENT_SEED_ROWS) {
    const existing = await ContentBlock.findOne({
      appKey: row.appKey,
      pageKey: row.pageKey,
      sectionKey: row.sectionKey,
      contentKey: row.contentKey,
      locale: row.locale,
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      await ContentBlock.create({
        ...row,
        defaultValue: row.value,
        isActive: true,
      });
      created += 1;
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        skipped += 1;
      } else {
        failed += 1;
        console.error("[seed:content] Failed row:", row, err);
      }
    }
  }

  console.log(`Content seed complete: ${created} created, ${skipped} skipped, ${failed} failed.`);
  await disconnectDatabase();
  if (failed > 0) process.exit(1);
}

seedContent().catch((err) => {
  console.error("Content seed failed:", err);
  process.exit(1);
});

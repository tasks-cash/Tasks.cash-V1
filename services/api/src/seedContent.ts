import dotenv from "dotenv";
import path from "path";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { ContentBlock } from "./models/ContentBlock";
import { importMissingContent } from "./lib/contentAudit";

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

  const { created, skipped, failed } = await importMissingContent();

  console.log(`Content seed complete: ${created} created, ${skipped} skipped, ${failed} failed.`);
  await disconnectDatabase();
  if (failed > 0) process.exit(1);
}

seedContent().catch((err) => {
  console.error("Content seed failed:", err);
  process.exit(1);
});

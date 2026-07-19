#!/usr/bin/env node
/**
 * Local concurrency smoke: 20 parallel GETs against homepage content cache.
 * Usage: node scripts/content-cache-concurrency.mjs
 * Requires API on :4000.
 */
const URL =
  process.env.CONTENT_URL ??
  "http://localhost:4000/api/content?appKey=main&pageKey=home&locale=en";
const N = Number(process.env.CONCURRENCY ?? 20);

async function one(i) {
  const t0 = Date.now();
  const res = await fetch(URL);
  const text = await res.text();
  const ms = Date.now() - t0;
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return {
    i,
    status: res.status,
    ms,
    bytes: text.length,
    ok: res.status === 200 && json?.success === true,
    hash: json ? String(json.data?.["hero.title"] ?? json.data?.sections?.hero?.title ?? "").slice(0, 40) : "",
  };
}

const results = await Promise.all(Array.from({ length: N }, (_, i) => one(i)));
const statuses = new Set(results.map((r) => r.status));
const hashes = new Set(results.map((r) => r.hash));
const allOk = results.every((r) => r.ok);
const avg = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);

console.log(
  JSON.stringify(
    {
      concurrency: N,
      allHttp200: [...statuses].length === 1 && statuses.has(200),
      allOk,
      uniquePayloadMarkers: hashes.size,
      avgMs: avg,
      maxMs: Math.max(...results.map((r) => r.ms)),
      minMs: Math.min(...results.map((r) => r.ms)),
      sampleBytes: results[0]?.bytes,
    },
    null,
    2
  )
);

if (!allOk) process.exit(1);

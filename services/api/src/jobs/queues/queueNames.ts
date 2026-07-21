/**
 * Canonical queue names — only registry-approved names may be used.
 */

export const QUEUE_NAMES = [
  "events",
  "workflows",
  "analytics",
  "notifications",
  "leaderboard",
  "rewards",
  "cache",
  "ai",
  "media",
  "system",
  "schedules",
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export const QUEUE_NAME_SET = new Set<string>(QUEUE_NAMES);

export function assertQueueName(name: string): asserts name is QueueName {
  if (!QUEUE_NAME_SET.has(name)) {
    throw new Error(`Unknown queue name: ${name}`);
  }
}

/**
 * Dedicated BullMQ Redis connection (maxRetriesPerRequest: null required by BullMQ).
 * Separate from the page-cache ioredis client.
 */

import IORedis, { type RedisOptions } from "ioredis";
import { getJobsConfig } from "../config/jobConfig";
import { logger } from "../../observability/logger";

let connection: IORedis | null = null;
let initFailed = false;

export function getJobsRedisConnection(): IORedis | null {
  if (connection) return connection;
  if (initFailed) return null;

  const cfg = getJobsConfig();
  if (!cfg.enabled || !cfg.redisUrl) {
    initFailed = true;
    return null;
  }

  try {
    const options: RedisOptions = {
      db: cfg.redisDb,
      maxRetriesPerRequest: null, // BullMQ requirement
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5_000,
    };
    connection = new IORedis(cfg.redisUrl, options);
    connection.on("error", (err) => {
      logger.warn("jobs.redis.error", {
        category: "redis",
        module: "jobs",
        error: err.message,
        status: "error",
      });
    });
    return connection;
  } catch (err) {
    initFailed = true;
    logger.warn("jobs.redis.init_failed", {
      category: "redis",
      module: "jobs",
      error: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

export async function connectJobsRedis(): Promise<boolean> {
  const client = getJobsRedisConnection();
  if (!client) return false;
  try {
    const connectPromise =
      client.status === "wait" || client.status === "end"
        ? client.connect()
        : Promise.resolve();
    await Promise.race([
      connectPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("jobs redis connect timeout")), 3_000)
      ),
    ]);
    return client.status === "ready" || client.status === "connect";
  } catch {
    try {
      client.disconnect();
    } catch {
      /* ignore */
    }
    connection = null;
    initFailed = true;
    return false;
  }
}

/** Test helper — force a fresh Redis client on next connect. */
export function resetJobsRedisForTests(): void {
  if (connection) {
    try {
      connection.disconnect();
    } catch {
      /* ignore */
    }
  }
  connection = null;
  initFailed = false;
}

export async function disconnectJobsRedis(): Promise<void> {
  if (!connection) return;
  try {
    await connection.quit();
  } catch {
    connection.disconnect();
  }
  connection = null;
}

export function isJobsRedisReady(): boolean {
  return Boolean(connection && (connection.status === "ready" || connection.status === "connect"));
}

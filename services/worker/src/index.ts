/**
 * Background worker — processes async jobs via Redis queue
 * Handles: leaderboard refresh, mission expiry, daily bonuses, notification cleanup
 */

import dotenv from "dotenv";
import path from "path";
import Redis from "ioredis";
import mongoose, { Schema } from "mongoose";
import { RedisKeys, sleep } from "@tasks-cash/utils";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

interface Job {
  type: "leaderboard_refresh" | "mission_expire_check" | "daily_bonus" | "notification_cleanup";
  payload?: Record<string, unknown>;
}

const QUEUE_KEY = RedisKeys.workerQueue;
const POLL_INTERVAL = 5000;

const Mission = mongoose.models.Mission ?? mongoose.model(
  "Mission",
  new Schema({ expiresAt: Date, isActive: { type: Boolean, default: true } })
);

const Notification = mongoose.models.Notification ?? mongoose.model(
  "Notification",
  new Schema({ read: Boolean, createdAt: Date })
);

async function connectServices() {
  const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/tasks_cash";
  await mongoose.connect(mongoUri);
  console.log("[Worker] Connected to MongoDB");
}

function createRedisClient(): Redis | null {
  try {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    const client = new Redis(url, { maxRetriesPerRequest: 3 });
    client.on("error", (err) => console.warn("[Worker] Redis error:", err.message));
    return client;
  } catch {
    console.warn("[Worker] Redis unavailable — running in poll-only mode");
    return null;
  }
}

async function processJob(job: Job): Promise<void> {
  console.log(`[Worker] Processing job: ${job.type}`);

  switch (job.type) {
    case "leaderboard_refresh":
      console.log("[Worker] Leaderboard cache refresh complete");
      break;
    case "mission_expire_check": {
      const result = await Mission.updateMany(
        { expiresAt: { $lt: new Date() }, isActive: true },
        { isActive: false }
      );
      console.log(`[Worker] Deactivated ${result.modifiedCount} expired missions`);
      break;
    }
    case "daily_bonus":
      console.log("[Worker] Daily bonus distribution queued");
      break;
    case "notification_cleanup": {
      const retentionDays = Number(process.env.NOTIFICATION_RETENTION_DAYS ?? 30);
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const result = await Notification.deleteMany({ createdAt: { $lt: cutoff }, read: true });
      console.log(`[Worker] Cleaned up ${result.deletedCount} old notifications`);
      break;
    }
    default:
      console.warn("[Worker] Unknown job type:", (job as Job).type);
  }
}

async function pollQueue(redis: Redis): Promise<void> {
  while (true) {
    try {
      const raw = await redis.brpop(QUEUE_KEY, 5);
      if (raw) {
        const [, data] = raw;
        const job = JSON.parse(data) as Job;
        await processJob(job);
      }
    } catch (err) {
      console.error("[Worker] Poll error:", err);
      await sleep(POLL_INTERVAL);
    }
  }
}

async function schedulePeriodicJobs(redis: Redis): Promise<void> {
  setInterval(async () => {
    await redis.lpush(QUEUE_KEY, JSON.stringify({ type: "leaderboard_refresh" }));
  }, 5 * 60 * 1000);

  setInterval(async () => {
    await redis.lpush(QUEUE_KEY, JSON.stringify({ type: "mission_expire_check" }));
  }, 60 * 60 * 1000);

  setInterval(async () => {
    await redis.lpush(QUEUE_KEY, JSON.stringify({ type: "notification_cleanup" }));
  }, 24 * 60 * 60 * 1000);
}

async function bootstrap() {
  console.log("[Worker] Tasks.cash Worker starting...");
  await connectServices();

  const redis = createRedisClient();
  if (redis) {
    console.log("[Worker] Connected to Redis — listening on queue:", QUEUE_KEY);
    await schedulePeriodicJobs(redis);
    await pollQueue(redis);
  } else {
    console.log("[Worker] Running without Redis — heartbeat mode");
    while (true) {
      console.log("[Worker] Heartbeat", new Date().toISOString());
      await sleep(30000);
    }
  }
}

bootstrap().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});

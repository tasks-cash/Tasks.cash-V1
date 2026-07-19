import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

import { connectDatabase } from "./config/database";
import { isDbConnected } from "./config/database";
import { connectRedis, isRedisReady } from "./config/redis";
import { getPageCacheConfig } from "./config/cacheConfig";
import { ensureDefaultAdminAccounts } from "./services/defaultAdminAccountsService";
import { APP_URL, ADMIN_URL, CHALLENGE_APP_URL } from "./config/env";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import missionRoutes from "./routes/missions";
import rewardRoutes from "./routes/rewards";
import leaderboardRoutes from "./routes/leaderboard";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";
import settingsRoutes from "./routes/settings";
import walletRoutes from "./routes/wallet";
import referralRoutes from "./routes/referrals";
import employeeRoutes from "./routes/employees";
import submissionRoutes from "./routes/submissions";
import withdrawalRoutes from "./routes/withdrawals";
import levelRoutes from "./routes/levels";
import challengeRoutes from "./routes/challenges";
import treasureRoutes from "./routes/treasures";
import supportRoutes from "./routes/support";
import gameRoutes from "./routes/game";
import mysteryMissionRoutes from "./routes/mysteryMissions";
import videoSubmissionRoutes from "./routes/videoSubmissions";
import counterRoutes from "./routes/counters";
import adminCounterRoutes from "./routes/adminCounters";
import explorerDnaRoutes from "./routes/explorerDna";
import adminExplorerDnaRoutes from "./routes/adminExplorerDna";
import adminDnaQuestionsRoutes from "./routes/adminDnaQuestions";
import raidRoutes from "./routes/raids";
import duelRoutes from "./routes/duels";
import vaultRoutes from "./routes/vault";
import contentRoutes from "./routes/content";
import adminContentRoutes from "./routes/adminContent";
import adminContentCacheRoutes from "./routes/adminContentCache";

// Load .env in local dev only — Docker injects env vars directly; never override existing vars
const rootEnv = path.resolve(__dirname, "../../../.env");
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: rootEnv, override: false });
  dotenv.config({ override: false });
}

const app = express();
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

app.use(helmet());
app.use(cors({
  origin: [APP_URL, ADMIN_URL, CHALLENGE_APP_URL],
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());

// Health check — process liveness + dependency readiness (no secrets).
app.get("/health", (_req, res) => {
  const mongoOk = isDbConnected();
  const redisOk = isRedisReady();
  const cacheCfg = getPageCacheConfig();
  const pageCache = !cacheCfg.enabled
    ? "disabled"
    : redisOk
      ? "enabled"
      : "degraded";
  const overall =
    !mongoOk && !redisOk ? "unavailable" : !mongoOk || !redisOk ? "degraded" : "ok";
  res.status(mongoOk ? 200 : 503).json({
    status: overall,
    service: "tasks-cash-api",
    timestamp: new Date().toISOString(),
    components: {
      api: "up",
      mongodb: mongoOk ? "up" : "down",
      redis: redisOk ? "up" : "down",
      pageCache,
    },
    // Backward-compatible fields (no URLs / credentials)
    mongo: mongoOk ? "connected" : "unavailable",
    redis: redisOk ? "connected" : "unavailable",
    redisDb: cacheCfg.redisDb,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/treasures", treasureRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/mystery-missions", mysteryMissionRoutes);
app.use("/api/video-submissions", videoSubmissionRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/admin/counters", adminCounterRoutes);
app.use("/api/explorer-dna", explorerDnaRoutes);
app.use("/api/admin/explorer-dna", adminExplorerDnaRoutes);
app.use("/api/admin/dna-questions", adminDnaQuestionsRoutes);
app.use("/api/raids", raidRoutes);
app.use("/api/duels", duelRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/admin/content-cache", adminContentCacheRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

async function bootstrap() {
  try {
    await connectDatabase();
    if (isDbConnected()) {
      try {
        await ensureDefaultAdminAccounts();
      } catch (err) {
        console.warn("[AdminBootstrap] Failed to ensure default admin accounts:", err);
      }
    }
  } catch (err) {
    console.warn("[DB] MongoDB unavailable — API will return 503 for database routes");
  }

  try {
    await connectRedis();
  } catch {
    console.warn("[Redis] unavailable — continuing without cache");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[API] Tasks.cash API running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("[API] Failed to start:", err);
  process.exit(1);
});

export default app;

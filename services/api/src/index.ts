import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
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

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const PORT = process.env.API_PORT ?? 4000;

app.use(helmet());
app.use(cors({
  origin: [
    process.env.APP_URL ?? "http://localhost:3000",
    process.env.ADMIN_URL ?? "http://localhost:3001",
  ],
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "tasks-cash-api", timestamp: new Date().toISOString() });
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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

async function bootstrap() {
  try {
    await connectDatabase();
  } catch (err) {
    console.warn("[DB] MongoDB unavailable — using in-memory fallback store");
  }

  try {
    await connectRedis();
  } catch {
    console.warn("[Redis] unavailable — continuing without cache");
  }

  app.listen(PORT, () => {
    console.log(`[API] Tasks.cash API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("[API] Failed to start:", err);
  process.exit(1);
});

export default app;

import mongoose from "mongoose";
import { logger } from "../observability/logger";
import { installMongoInstrumentation } from "../observability/mongoInstrumentation";

export let dbConnected = false;

export async function connectDatabase(uri?: string): Promise<void> {
  const mongoUri = uri ?? process.env.MONGODB_URI ?? "mongodb://localhost:27017/tasks_cash";

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    // Fail soft quickly when Mongo is unreachable — cache may still serve pages.
    serverSelectionTimeoutMS: 3_000,
    socketTimeoutMS: 5_000,
    // Enable driver command monitoring for observability (no query shape change).
    monitorCommands: true,
  } as mongoose.ConnectOptions);

  dbConnected = true;
  installMongoInstrumentation();
  logger.info("Connected to MongoDB", {
    category: "mongo",
    module: "mongodb",
    operation: "connect",
    status: "ok",
  });
}

export function isDbConnected(): boolean {
  return dbConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  dbConnected = false;
  logger.info("Disconnected from MongoDB", {
    category: "mongo",
    module: "mongodb",
    operation: "disconnect",
    status: "ok",
  });
}

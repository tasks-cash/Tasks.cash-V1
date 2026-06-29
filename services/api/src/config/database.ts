import mongoose from "mongoose";

export let dbConnected = false;

export async function connectDatabase(uri?: string): Promise<void> {
  const mongoUri = uri ?? process.env.MONGODB_URI ?? "mongodb://localhost:27017/tasks_cash";

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);
  dbConnected = true;
  console.log("[DB] Connected to MongoDB");
}

export function isDbConnected(): boolean {
  return dbConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log("[DB] Disconnected from MongoDB");
}

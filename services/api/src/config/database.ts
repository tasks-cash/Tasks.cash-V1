import mongoose from "mongoose";

export async function connectDatabase(uri?: string): Promise<void> {
  const mongoUri = uri ?? process.env.MONGODB_URI ?? "mongodb://localhost:27017/tasks_cash";

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);
  console.log("[DB] Connected to MongoDB");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log("[DB] Disconnected from MongoDB");
}

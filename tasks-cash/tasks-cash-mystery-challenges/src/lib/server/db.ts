import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseChallengeCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseChallengeCache ?? { conn: null, promise: null };
if (!global.mongooseChallengeCache) {
  global.mongooseChallengeCache = cached;
}

export async function connectDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  return cached.promise;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(MONGODB_URI);
}

import { Response } from "express";
import { isDbConnected } from "../config/database";

/** Respond with 503 when MongoDB is unavailable — no in-memory runtime fallback. */
export function requireDbConnection(res: Response): boolean {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, error: "Database unavailable" });
  return false;
}

import mongoose from "mongoose";
import { logger, getObservabilityConfig } from "./logger";

const pending = new Map<number, { name: string; started: number; collection?: string }>();
let installed = false;

/**
 * MongoDB command monitoring via the official driver events.
 * Requires `monitorCommands: true` on connect.
 */
export function installMongoInstrumentation(): void {
  if (installed) return;
  installed = true;

  const attach = (): void => {
    const client = mongoose.connection.getClient?.();
    if (!client) return;

    client.on("commandStarted", (event: { requestId: number; commandName: string; databaseName?: string; command?: Record<string, unknown> }) => {
      const collection = extractCollection(event.commandName, event.command);
      pending.set(event.requestId, {
        name: event.commandName,
        started: Date.now(),
        collection,
      });
    });

    client.on("commandSucceeded", (event: {
      requestId: number;
      commandName: string;
      duration: number;
      reply?: Record<string, unknown>;
    }) => {
      const meta = pending.get(event.requestId);
      pending.delete(event.requestId);
      const durationMs = event.duration ?? (meta ? Date.now() - meta.started : 0);
      const cfg = getObservabilityConfig();
      const reply = event.reply ?? {};
      const fields = {
        category: "mongo" as const,
        module: "mongodb",
        operation: event.commandName,
        collection: meta?.collection,
        durationMs,
        matched: typeof reply.n === "number" ? reply.n : reply.nModified !== undefined ? reply.n : undefined,
        modified: typeof reply.nModified === "number" ? reply.nModified : undefined,
        inserted: typeof reply.n === "number" && event.commandName === "insert" ? reply.n : undefined,
        deleted: typeof reply.n === "number" && event.commandName === "delete" ? reply.n : undefined,
        status: "ok",
      };

      if (durationMs >= cfg.mongoSlowMs) {
        logger.warn(`Slow MongoDB ${event.commandName}`, {
          ...fields,
          category: "performance",
          suspectedMissingIndex: looksLikeCollScan(event.commandName, durationMs),
        });
      } else {
        logger.debug(`MongoDB ${event.commandName}`, fields);
      }
    });

    client.on("commandFailed", (event: {
      requestId: number;
      commandName: string;
      duration?: number;
      failure?: Error;
    }) => {
      const meta = pending.get(event.requestId);
      pending.delete(event.requestId);
      logger.error(`MongoDB ${event.commandName} failed`, {
        category: "error",
        module: "mongodb",
        operation: event.commandName,
        collection: meta?.collection,
        durationMs: event.duration ?? (meta ? Date.now() - meta.started : undefined),
        error: event.failure?.message ?? "command failed",
        status: "error",
      });
    });
  };

  if (mongoose.connection.readyState === 1) {
    attach();
  } else {
    mongoose.connection.once("connected", attach);
  }
}

function extractCollection(commandName: string, command?: Record<string, unknown>): string | undefined {
  if (!command) return undefined;
  const direct = command[commandName];
  if (typeof direct === "string") return direct;
  if (typeof command.find === "string") return command.find;
  if (typeof command.insert === "string") return command.insert;
  if (typeof command.update === "string") return command.update;
  if (typeof command.delete === "string") return command.delete;
  if (typeof command.aggregate === "string") return command.aggregate;
  if (typeof command.createIndexes === "string") return command.createIndexes;
  return undefined;
}

/** Heuristic only — driver does not always expose winning plan. */
function looksLikeCollScan(commandName: string, durationMs: number): boolean {
  return ["find", "aggregate", "count", "distinct"].includes(commandName) && durationMs >= getObservabilityConfig().mongoSlowMs * 2;
}

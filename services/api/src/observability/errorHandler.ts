import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { DomainError } from "../domain/shared/domainErrors";
import { toHttpError } from "../domain/services/errors";

/**
 * Express error middleware — structured ERROR logs, no secret leakage.
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const mapped = err instanceof DomainError || (err && typeof err === "object" && "name" in (err as object))
    ? toHttpError(err)
    : { status: 500, body: { success: false as const, error: "Internal server error", code: "INTERNAL" } };

  logger.error("Unhandled request error", {
    category: "error",
    module: "http",
    operation: `${req.method} ${req.path}`,
    status: mapped.status,
    error: err instanceof Error ? err.message : "unknown",
    stack: err instanceof Error ? err.stack : undefined,
    requestId: req.requestId,
    correlationId: req.correlationId,
  });

  if (!res.headersSent) {
    res.status(mapped.status).json(mapped.body);
  }
}

/** Process-level safety nets. */
export function installProcessErrorHandlers(): void {
  process.on("uncaughtException", (err) => {
    logger.fatal("uncaughtException", {
      category: "error",
      module: "process",
      operation: "uncaughtException",
      error: err.message,
      stack: err.stack,
      status: "fatal",
    });
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("unhandledRejection", {
      category: "error",
      module: "process",
      operation: "unhandledRejection",
      error: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      status: "error",
    });
  });
}

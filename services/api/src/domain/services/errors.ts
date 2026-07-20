/**
 * Phase-3 typed domain/service errors.
 * Extends Phase-2 DomainError hierarchy with HTTP-mappable aliases.
 */

export {
  DomainError,
  TenantIsolationError,
  DomainNotFoundError,
  DuplicateDomainKeyError,
  DomainValidationError,
  InvalidStatusTransitionError,
  ImmutableLedgerError,
  StaleVersionError,
  mapMongoError,
} from "../shared/domainErrors";

import {
  DomainError,
  DomainNotFoundError,
  DomainValidationError,
  DuplicateDomainKeyError,
  ImmutableLedgerError,
  InvalidStatusTransitionError,
} from "../shared/domainErrors";

export class ValidationError extends DomainValidationError {
  constructor(message: string, details: string[] = []) {
    super(message, details);
    this.name = "ValidationError";
  }
}

export class LifecycleError extends InvalidStatusTransitionError {
  constructor(entity: string, from: string, to: string) {
    super(entity, from, to);
    this.name = "LifecycleError";
  }
}

export class PermissionError extends DomainError {
  constructor(message = "Insufficient permissions") {
    super("PERMISSION_DENIED", message, 403);
    this.name = "PermissionError";
  }
}

export class DuplicateSubmissionError extends DuplicateDomainKeyError {
  constructor(keyPattern: Record<string, unknown> = {}) {
    super("Submission", keyPattern);
    this.name = "DuplicateSubmissionError";
    Object.assign(this, { code: "DUPLICATE_SUBMISSION" });
  }
}

export class DuplicateRewardError extends DuplicateDomainKeyError {
  constructor(keyPattern: Record<string, unknown> = {}) {
    super("DomainReward", keyPattern);
    this.name = "DuplicateRewardError";
    Object.assign(this, { code: "DUPLICATE_REWARD" });
  }
}

export class WalletError extends DomainError {
  constructor(message: string, httpStatus = 409) {
    super("WALLET_ERROR", message, httpStatus);
    this.name = "WalletError";
  }
}

export class LedgerError extends ImmutableLedgerError {
  constructor(message?: string) {
    super(message);
    this.name = "LedgerError";
  }
}

export class NotFoundError extends DomainNotFoundError {
  constructor(entity: string, id: string) {
    super(entity, id);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "Rate limit exceeded") {
    super("RATE_LIMIT", message, 429);
    this.name = "RateLimitError";
  }
}

/** Map any known domain error into a JSON-safe HTTP body. */
export function toHttpError(err: unknown): {
  status: number;
  body: { success: false; error: string; code?: string; details?: string[] };
} {
  if (err instanceof DomainError) {
    const body: { success: false; error: string; code?: string; details?: string[] } = {
      success: false,
      error: err.message,
      code: err.code,
    };
    if (err instanceof DomainValidationError && err.details.length) {
      body.details = err.details;
    }
    return { status: err.httpStatus, body };
  }
  if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError") {
    const issues = (err as { issues?: Array<{ message: string; path: (string | number)[] }> }).issues ?? [];
    return {
      status: 400,
      body: {
        success: false,
        error: "Validation failed",
        code: "VALIDATION",
        details: issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
    };
  }
  return { status: 500, body: { success: false, error: "Internal server error", code: "INTERNAL" } };
}

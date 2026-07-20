/**
 * Typed domain errors. Repositories convert raw Mongo/Mongoose failures
 * into these so route handlers never leak driver internals.
 */

export class DomainError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class TenantIsolationError extends DomainError {
  constructor(message = "tenantId is required for all domain queries") {
    super("TENANT_ISOLATION", message, 500);
    this.name = "TenantIsolationError";
  }
}

export class DomainNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} not found: ${id}`, 404);
    this.name = "DomainNotFoundError";
  }
}

export class DuplicateDomainKeyError extends DomainError {
  readonly keyPattern: Record<string, unknown>;

  constructor(entity: string, keyPattern: Record<string, unknown> = {}) {
    super("DUPLICATE_KEY", `${entity} already exists for the given unique key`, 409);
    this.name = "DuplicateDomainKeyError";
    this.keyPattern = keyPattern;
  }
}

export class DomainValidationError extends DomainError {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super("VALIDATION", message, 422);
    this.name = "DomainValidationError";
    this.details = details;
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super("INVALID_TRANSITION", `${entity}: illegal status transition ${from} → ${to}`, 409);
    this.name = "InvalidStatusTransitionError";
  }
}

export class ImmutableLedgerError extends DomainError {
  constructor(message = "Posted wallet transactions are immutable — use a reversal transaction") {
    super("IMMUTABLE_LEDGER", message, 409);
    this.name = "ImmutableLedgerError";
  }
}

export class StaleVersionError extends DomainError {
  constructor(entity: string, id: string) {
    super("STALE_VERSION", `${entity} was modified concurrently: ${id}`, 409);
    this.name = "StaleVersionError";
  }
}

interface MongoServerErrorLike {
  code?: number;
  keyPattern?: Record<string, unknown>;
  name?: string;
  message?: string;
  errors?: Record<string, { message?: string }>;
}

/** Map raw driver errors to typed domain errors; rethrow unknown failures. */
export function mapMongoError(err: unknown, entity: string): never {
  const e = err as MongoServerErrorLike;
  if (e?.code === 11000) {
    throw new DuplicateDomainKeyError(entity, e.keyPattern ?? {});
  }
  if (e?.name === "ValidationError" && e.errors) {
    const details = Object.values(e.errors)
      .map((v) => v?.message ?? "")
      .filter(Boolean);
    throw new DomainValidationError(`${entity} validation failed`, details);
  }
  if (e?.name === "VersionError") {
    throw new StaleVersionError(entity, "unknown");
  }
  throw err;
}

/**
 * Typed job errors with retry classification.
 */

export type JobFailureClass = "retryable" | "permanent" | "cancelled" | "already_processed";

export class JobError extends Error {
  readonly code: string;
  readonly failureClass: JobFailureClass;
  readonly httpStatus: number;

  constructor(
    code: string,
    message: string,
    failureClass: JobFailureClass = "permanent",
    httpStatus = 400
  ) {
    super(message);
    this.name = "JobError";
    this.code = code;
    this.failureClass = failureClass;
    this.httpStatus = httpStatus;
  }
}

export class JobValidationError extends JobError {
  readonly details: string[];
  constructor(message: string, details: string[] = []) {
    super("JOB_VALIDATION", message, "permanent", 422);
    this.name = "JobValidationError";
    this.details = details;
  }
}

export class JobRegistrationError extends JobError {
  constructor(message: string) {
    super("JOB_REGISTRATION", message, "permanent", 500);
    this.name = "JobRegistrationError";
  }
}

export class JobRetryableError extends JobError {
  constructor(message: string) {
    super("JOB_RETRYABLE", message, "retryable", 503);
    this.name = "JobRetryableError";
  }
}

export class JobPermanentError extends JobError {
  constructor(message: string) {
    super("JOB_PERMANENT", message, "permanent", 422);
    this.name = "JobPermanentError";
  }
}

export class JobCancelledError extends JobError {
  constructor(message = "Job cancelled") {
    super("JOB_CANCELLED", message, "cancelled", 409);
    this.name = "JobCancelledError";
  }
}

export class JobIdempotencyError extends JobError {
  constructor(message = "Job already processed") {
    super("JOB_IDEMPOTENCY", message, "already_processed", 409);
    this.name = "JobIdempotencyError";
  }
}

export class JobTimeoutError extends JobError {
  constructor(jobName: string, timeoutMs: number) {
    super("JOB_TIMEOUT", `Job ${jobName} timed out after ${timeoutMs}ms`, "retryable", 504);
    this.name = "JobTimeoutError";
  }
}

export class JobLockError extends JobError {
  constructor(message: string) {
    super("JOB_LOCK", message, "retryable", 409);
    this.name = "JobLockError";
  }
}

export function classifyJobError(err: unknown): JobFailureClass {
  if (err instanceof JobError) return err.failureClass;
  if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
    return "already_processed";
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (/timeout|ECONNREFUSED|ECONNRESET|temporar|unavailable|network|stalled/i.test(msg)) {
    return "retryable";
  }
  return "permanent";
}

/**
 * Typed event / workflow errors with retry classification.
 */

export type FailureClass = "retryable" | "permanent" | "ignored" | "already_processed";

export class EventError extends Error {
  readonly code: string;
  readonly failureClass: FailureClass;
  readonly httpStatus: number;

  constructor(
    code: string,
    message: string,
    failureClass: FailureClass = "permanent",
    httpStatus = 400
  ) {
    super(message);
    this.name = "EventError";
    this.code = code;
    this.failureClass = failureClass;
    this.httpStatus = httpStatus;
  }
}

export class EventValidationError extends EventError {
  readonly details: string[];
  constructor(message: string, details: string[] = []) {
    super("EVENT_VALIDATION", message, "permanent", 422);
    this.name = "EventValidationError";
    this.details = details;
  }
}

export class EventRegistrationError extends EventError {
  constructor(message: string) {
    super("EVENT_REGISTRATION", message, "permanent", 500);
    this.name = "EventRegistrationError";
  }
}

export class EventDispatchError extends EventError {
  constructor(message: string, failureClass: FailureClass = "retryable") {
    super("EVENT_DISPATCH", message, failureClass, 500);
    this.name = "EventDispatchError";
  }
}

export class EventHandlerTimeoutError extends EventError {
  constructor(handlerName: string, timeoutMs: number) {
    super(
      "EVENT_HANDLER_TIMEOUT",
      `Handler ${handlerName} timed out after ${timeoutMs}ms`,
      "retryable",
      504
    );
    this.name = "EventHandlerTimeoutError";
  }
}

export class EventHandlerRetryableError extends EventError {
  constructor(message: string) {
    super("EVENT_HANDLER_RETRYABLE", message, "retryable", 503);
    this.name = "EventHandlerRetryableError";
  }
}

export class EventHandlerPermanentError extends EventError {
  constructor(message: string) {
    super("EVENT_HANDLER_PERMANENT", message, "permanent", 422);
    this.name = "EventHandlerPermanentError";
  }
}

export class EventPersistenceError extends EventError {
  constructor(message: string, failureClass: FailureClass = "retryable") {
    super("EVENT_PERSISTENCE", message, failureClass, 500);
    this.name = "EventPersistenceError";
  }
}

export class EventIdempotencyError extends EventError {
  constructor(message = "Event already processed") {
    super("EVENT_IDEMPOTENCY", message, "already_processed", 409);
    this.name = "EventIdempotencyError";
  }
}

export class EventLockError extends EventError {
  constructor(message: string) {
    super("EVENT_LOCK", message, "retryable", 409);
    this.name = "EventLockError";
  }
}

export class WorkflowDefinitionError extends EventError {
  constructor(message: string) {
    super("WORKFLOW_DEFINITION", message, "permanent", 422);
    this.name = "WorkflowDefinitionError";
  }
}

export class WorkflowTransitionError extends EventError {
  constructor(message: string) {
    super("WORKFLOW_TRANSITION", message, "permanent", 409);
    this.name = "WorkflowTransitionError";
  }
}

export class WorkflowExecutionError extends EventError {
  constructor(message: string, failureClass: FailureClass = "retryable") {
    super("WORKFLOW_EXECUTION", message, failureClass, 500);
    this.name = "WorkflowExecutionError";
  }
}

export class WorkflowCompensationError extends EventError {
  constructor(message: string) {
    super("WORKFLOW_COMPENSATION", message, "retryable", 500);
    this.name = "WorkflowCompensationError";
  }
}

export function classifyError(err: unknown): FailureClass {
  if (err instanceof EventError) return err.failureClass;
  if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
    return "already_processed";
  }
  // Network / timeout-ish → retryable
  const msg = err instanceof Error ? err.message : String(err);
  if (/timeout|ECONNREFUSED|ECONNRESET|temporar|unavailable|network/i.test(msg)) {
    return "retryable";
  }
  return "permanent";
}

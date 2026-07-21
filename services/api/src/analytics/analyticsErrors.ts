/**
 * Typed analytics errors.
 */

export type AnalyticsFailureClass = "validation" | "consent" | "rate_limit" | "not_found" | "conflict" | "disabled";

export class AnalyticsError extends Error {
  readonly code: string;
  readonly failureClass: AnalyticsFailureClass;
  readonly httpStatus: number;

  constructor(
    code: string,
    message: string,
    failureClass: AnalyticsFailureClass = "validation",
    httpStatus = 400
  ) {
    super(message);
    this.name = "AnalyticsError";
    this.code = code;
    this.failureClass = failureClass;
    this.httpStatus = httpStatus;
  }
}

export class AnalyticsValidationError extends AnalyticsError {
  readonly details: string[];
  constructor(message: string, details: string[] = []) {
    super("ANALYTICS_VALIDATION", message, "validation", 422);
    this.name = "AnalyticsValidationError";
    this.details = details;
  }
}

export class AnalyticsConsentError extends AnalyticsError {
  constructor(message = "Analytics consent not granted") {
    super("ANALYTICS_CONSENT_DENIED", message, "consent", 403);
    this.name = "AnalyticsConsentError";
  }
}

export class AnalyticsRateLimitError extends AnalyticsError {
  constructor(message = "Analytics rate limit exceeded") {
    super("ANALYTICS_RATE_LIMIT", message, "rate_limit", 429);
    this.name = "AnalyticsRateLimitError";
  }
}

export class AnalyticsDisabledError extends AnalyticsError {
  constructor(message = "Analytics is disabled") {
    super("ANALYTICS_DISABLED", message, "disabled", 503);
    this.name = "AnalyticsDisabledError";
  }
}

export class AnalyticsNotFoundError extends AnalyticsError {
  constructor(entity: string, id: string) {
    super("ANALYTICS_NOT_FOUND", `${entity} not found: ${id}`, "not_found", 404);
    this.name = "AnalyticsNotFoundError";
  }
}

export function toAnalyticsHttpError(err: unknown): {
  status: number;
  body: { success: false; error: string; code?: string; details?: string[] };
} {
  if (err instanceof AnalyticsError) {
    return {
      status: err.httpStatus,
      body: {
        success: false,
        error: err.message,
        code: err.code,
        details: err instanceof AnalyticsValidationError ? err.details : undefined,
      },
    };
  }
  if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError") {
    const issues = (err as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues ?? [];
    return {
      status: 422,
      body: {
        success: false,
        error: "Invalid analytics payload",
        code: "ANALYTICS_VALIDATION",
        details: issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
    };
  }
  return {
    status: 500,
    body: { success: false, error: "Analytics request failed", code: "ANALYTICS_INTERNAL" },
  };
}

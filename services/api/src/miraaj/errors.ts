export type MiraajErrorCode = "configuration_error"|"authentication_error"|"authorization_error"|"validation_error"|"rate_limited"|"timeout"|"connection_error"|"service_unavailable"|"circuit_open"|"rejected_request"|"capability_unavailable"|"execution_failed"|"invalid_response"|"signature_invalid"|"replay_detected"|"cancellation_failed"|"reconciliation_failed"|"unknown_external_error";
export class MiraajIntegrationError extends Error {
  constructor(public readonly code: MiraajErrorCode, message: string, public readonly retryable: boolean, public readonly status = 502, public readonly externalTraceId?: string) { super(message); this.name = "MiraajIntegrationError"; }
}

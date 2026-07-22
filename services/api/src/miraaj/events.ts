export const MIRAAJ_EVENTS = {
  CREATED:"miraaj.execution.created.v1", SUBMISSION_REQUESTED:"miraaj.execution.submission_requested.v1", ACCEPTED:"miraaj.execution.accepted.v1",
  STARTED:"miraaj.execution.started.v1", COMPLETED:"miraaj.execution.completed.v1", FAILED:"miraaj.execution.failed.v1",
  CANCEL_REQUESTED:"miraaj.execution.cancel_requested.v1", CANCELLED:"miraaj.execution.cancelled.v1", SYNC_REQUIRED:"miraaj.execution.synchronization_required.v1",
  RECONCILED:"miraaj.execution.reconciled.v1", WEBHOOK_RECEIVED:"miraaj.webhook.received.v1", WEBHOOK_REJECTED:"miraaj.webhook.rejected.v1",
  CIRCUIT_OPENED:"miraaj.circuit.opened.v1", CIRCUIT_CLOSED:"miraaj.circuit.closed.v1",
} as const;

/**
 * In-memory event/workflow metrics for diagnostics (no Prometheus required).
 */

export interface EventMetricsSnapshot {
  eventsPublished: number;
  eventsDispatched: number;
  handlerSuccesses: number;
  handlerFailures: number;
  handlerSkips: number;
  retries: number;
  deadLetters: number;
  workflowStarts: number;
  workflowCompletions: number;
  workflowFailures: number;
  compensations: number;
  handlerDurationMsTotal: number;
  handlerDurationCount: number;
  workflowDurationMsTotal: number;
  workflowDurationCount: number;
  dispatcherCycles: number;
  dispatcherLastSuccessAt?: string;
  dispatcherLastError?: string;
  outboxPendingApprox: number;
  outboxFailedApprox: number;
  outboxDeadLetterApprox: number;
  oldestPendingAgeMs?: number;
}

const m: EventMetricsSnapshot = {
  eventsPublished: 0,
  eventsDispatched: 0,
  handlerSuccesses: 0,
  handlerFailures: 0,
  handlerSkips: 0,
  retries: 0,
  deadLetters: 0,
  workflowStarts: 0,
  workflowCompletions: 0,
  workflowFailures: 0,
  compensations: 0,
  handlerDurationMsTotal: 0,
  handlerDurationCount: 0,
  workflowDurationMsTotal: 0,
  workflowDurationCount: 0,
  dispatcherCycles: 0,
  outboxPendingApprox: 0,
  outboxFailedApprox: 0,
  outboxDeadLetterApprox: 0,
};

export const eventMetrics = {
  published: () => {
    m.eventsPublished += 1;
  },
  dispatched: () => {
    m.eventsDispatched += 1;
  },
  handlerOk: (durationMs: number) => {
    m.handlerSuccesses += 1;
    m.handlerDurationMsTotal += durationMs;
    m.handlerDurationCount += 1;
  },
  handlerFail: (durationMs: number) => {
    m.handlerFailures += 1;
    m.handlerDurationMsTotal += durationMs;
    m.handlerDurationCount += 1;
  },
  handlerSkip: () => {
    m.handlerSkips += 1;
  },
  retry: () => {
    m.retries += 1;
  },
  deadLetter: () => {
    m.deadLetters += 1;
  },
  workflowStart: () => {
    m.workflowStarts += 1;
  },
  workflowComplete: (durationMs: number) => {
    m.workflowCompletions += 1;
    m.workflowDurationMsTotal += durationMs;
    m.workflowDurationCount += 1;
  },
  workflowFail: (durationMs: number) => {
    m.workflowFailures += 1;
    m.workflowDurationMsTotal += durationMs;
    m.workflowDurationCount += 1;
  },
  compensate: () => {
    m.compensations += 1;
  },
  dispatcherCycle: (ok: boolean, error?: string) => {
    m.dispatcherCycles += 1;
    if (ok) m.dispatcherLastSuccessAt = new Date().toISOString();
    if (error) m.dispatcherLastError = error;
  },
  setOutboxStats: (pending: number, failed: number, dead: number, oldestAgeMs?: number) => {
    m.outboxPendingApprox = pending;
    m.outboxFailedApprox = failed;
    m.outboxDeadLetterApprox = dead;
    m.oldestPendingAgeMs = oldestAgeMs;
  },
  snapshot(): EventMetricsSnapshot {
    return { ...m };
  },
  resetForTests(): void {
    m.eventsPublished = 0;
    m.eventsDispatched = 0;
    m.handlerSuccesses = 0;
    m.handlerFailures = 0;
    m.handlerSkips = 0;
    m.retries = 0;
    m.deadLetters = 0;
    m.workflowStarts = 0;
    m.workflowCompletions = 0;
    m.workflowFailures = 0;
    m.compensations = 0;
    m.handlerDurationMsTotal = 0;
    m.handlerDurationCount = 0;
    m.workflowDurationMsTotal = 0;
    m.workflowDurationCount = 0;
    m.dispatcherCycles = 0;
    m.outboxPendingApprox = 0;
    m.outboxFailedApprox = 0;
    m.outboxDeadLetterApprox = 0;
    m.dispatcherLastSuccessAt = undefined;
    m.dispatcherLastError = undefined;
    m.oldestPendingAgeMs = undefined;
  },
};

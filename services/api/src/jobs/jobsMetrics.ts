/**
 * In-memory job/queue metrics for diagnostics.
 */

export interface JobsMetricsSnapshot {
  jobsEnqueued: number;
  jobsCompleted: number;
  jobsFailed: number;
  jobsRetried: number;
  jobsDeadLettered: number;
  jobsCancelled: number;
  jobsSkippedIdempotent: number;
  workersStarted: number;
  lastEnqueueAt?: string;
  lastCompleteAt?: string;
  lastError?: string;
}

const m: JobsMetricsSnapshot = {
  jobsEnqueued: 0,
  jobsCompleted: 0,
  jobsFailed: 0,
  jobsRetried: 0,
  jobsDeadLettered: 0,
  jobsCancelled: 0,
  jobsSkippedIdempotent: 0,
  workersStarted: 0,
};

export const jobsMetrics = {
  enqueued: () => {
    m.jobsEnqueued += 1;
    m.lastEnqueueAt = new Date().toISOString();
  },
  completed: () => {
    m.jobsCompleted += 1;
    m.lastCompleteAt = new Date().toISOString();
  },
  failed: (error?: string) => {
    m.jobsFailed += 1;
    if (error) m.lastError = error.slice(0, 500);
  },
  retried: () => {
    m.jobsRetried += 1;
  },
  deadLetter: () => {
    m.jobsDeadLettered += 1;
  },
  cancelled: () => {
    m.jobsCancelled += 1;
  },
  skipped: () => {
    m.jobsSkippedIdempotent += 1;
  },
  workerStarted: () => {
    m.workersStarted += 1;
  },
  snapshot(): JobsMetricsSnapshot {
    return { ...m };
  },
  resetForTests(): void {
    m.jobsEnqueued = 0;
    m.jobsCompleted = 0;
    m.jobsFailed = 0;
    m.jobsRetried = 0;
    m.jobsDeadLettered = 0;
    m.jobsCancelled = 0;
    m.jobsSkippedIdempotent = 0;
    m.workersStarted = 0;
    m.lastEnqueueAt = undefined;
    m.lastCompleteAt = undefined;
    m.lastError = undefined;
  },
};

/**
 * Jobs platform public exports.
 */

export { getJobsConfig } from "./config/jobConfig";
export { JOB_NAMES, JOB_QUEUE_MAP, type JobName } from "./contracts/jobTypes";
export { QUEUE_NAMES, type QueueName } from "./queues/queueNames";
export {
  createJobEnvelope,
  sanitizeJobPayload,
  type JobEnvelope,
} from "./contracts/jobEnvelope";
export * from "./contracts/jobErrors";
export { registerJobHandler, getRegisteredJobHandlerCount, listJobHandlers } from "./registry/jobRegistry";
export { enqueueNamedJob } from "./enqueue";
export { enqueueJob, getQueueCounts, listQueues } from "./queues/queueManager";
export { cancelJob } from "./processing/jobCancellation";
export { bootstrapJobsSystem, shutdownJobsSystem, getJobsDiagnostics } from "./bootstrap";
export { jobsMetrics } from "./jobsMetrics";
export { JobExecution, JobDeadLetter, JobCancellation, JobSchedule } from "./persistence/jobModels";
export { enqueueWorkflowResume } from "./integrations/workflowJobBridge";
export { enqueueAnalyticsCleanup, enqueueAnalyticsAggregate } from "./integrations/analyticsJobBridge";
export { shouldDispatchOutboxViaBullmq } from "./integrations/eventBusJobBridge";

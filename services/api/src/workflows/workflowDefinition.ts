/**
 * Workflow step + definition contracts.
 */

import type { EventEnvelopeBase } from "../events/eventEnvelope";
import {
  WorkflowDefinitionError,
  WorkflowExecutionError,
} from "../events/eventErrors";

export interface WorkflowContext {
  tenantId: string;
  appKey: string;
  workflowRunId: string;
  workflowName: string;
  workflowVersion: number;
  triggerEvent: EventEnvelopeBase;
  requestId?: string;
  correlationId?: string;
  /** Mutable bag shared across steps (persisted on the run). */
  data: Record<string, unknown>;
}

export interface WorkflowStepResult {
  output?: Record<string, unknown>;
  skipRemaining?: boolean;
}

export interface WorkflowStepDefinition {
  name: string;
  version: string;
  description?: string;
  timeoutMs?: number;
  maximumAttempts?: number;
  optional?: boolean;
  fatalOnFailure?: boolean;
  requiresCompensation?: boolean;
  /** Return false to skip this step. */
  condition?: (ctx: WorkflowContext) => boolean | Promise<boolean>;
  execute: (ctx: WorkflowContext) => Promise<WorkflowStepResult | void>;
  compensate?: (ctx: WorkflowContext) => Promise<void>;
}

export interface WorkflowDefinitionInMemory {
  name: string;
  version: number;
  description?: string;
  triggerEventTypes: string[];
  timeoutMs?: number;
  maximumAttempts?: number;
  steps: WorkflowStepDefinition[];
}

const definitions = new Map<string, WorkflowDefinitionInMemory>();

export function registerWorkflow(def: WorkflowDefinitionInMemory): void {
  if (!def.name || !def.steps?.length) {
    throw new WorkflowDefinitionError("Workflow must have a name and steps");
  }
  if (!def.triggerEventTypes?.length) {
    throw new WorkflowDefinitionError(`Workflow ${def.name} needs triggerEventTypes`);
  }
  const key = `${def.name}@${def.version}`;
  if (definitions.has(key)) {
    throw new WorkflowDefinitionError(`Duplicate workflow: ${key}`);
  }
  const names = new Set<string>();
  for (const s of def.steps) {
    if (names.has(s.name)) {
      throw new WorkflowDefinitionError(`Duplicate step ${s.name} in ${def.name}`);
    }
    names.add(s.name);
  }
  definitions.set(key, def);
}

export function getWorkflow(name: string, version?: number): WorkflowDefinitionInMemory | undefined {
  if (version !== undefined) return definitions.get(`${name}@${version}`);
  let best: WorkflowDefinitionInMemory | undefined;
  for (const d of definitions.values()) {
    if (d.name !== name) continue;
    if (!best || d.version > best.version) best = d;
  }
  return best;
}

export function listWorkflows(): WorkflowDefinitionInMemory[] {
  return [...definitions.values()];
}

export function findWorkflowsForEvent(eventType: string): WorkflowDefinitionInMemory[] {
  return [...definitions.values()].filter((d) => d.triggerEventTypes.includes(eventType));
}

export function resetWorkflowRegistryForTests(): void {
  definitions.clear();
}

export function assertStepTimeout(ms: number, stepName: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new WorkflowExecutionError(`Step ${stepName} timed out after ${ms}ms`, "retryable"));
    }, ms);
  });
}

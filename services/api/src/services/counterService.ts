import mongoose from "mongoose";
import {
  COUNTER_KEYS,
  DEFAULT_COUNTER_DEFINITIONS,
  type CounterKey,
  type ICountersAdminResponse,
  type ICountersPublicResponse,
  type ICounterSetting,
  ZERO_COUNTER_VALUES,
} from "@tasks-cash/types";
import { CounterSetting } from "../models/CounterSetting";

const nowIso = () => new Date().toISOString();

function createDefaultCounter(def: (typeof DEFAULT_COUNTER_DEFINITIONS)[number]): ICounterSetting {
  return {
    key: def.key,
    label: def.label,
    value: 0,
    isActive: false,
    incrementMin: def.incrementMin,
    incrementMax: def.incrementMax,
    intervalSeconds: def.intervalSeconds,
    lastUpdatedAt: nowIso(),
  };
}

let memoryCounters: ICounterSetting[] = DEFAULT_COUNTER_DEFINITIONS.map(createDefaultCounter);
let globalRunning = false;
let tickInterval: ReturnType<typeof setInterval> | null = null;

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function toPlain(doc: ICounterSetting | Record<string, unknown>): ICounterSetting {
  const raw = doc as ICounterSetting;
  return {
    key: raw.key,
    label: raw.label,
    value: raw.value ?? 0,
    isActive: raw.isActive ?? false,
    incrementMin: raw.incrementMin ?? 1,
    incrementMax: raw.incrementMax ?? 3,
    intervalSeconds: raw.intervalSeconds ?? 5,
    lastUpdatedAt: raw.lastUpdatedAt ? new Date(raw.lastUpdatedAt).toISOString() : nowIso(),
  };
}

function valuesFromCounters(counters: ICounterSetting[]): Record<CounterKey, number> {
  const values = { ...ZERO_COUNTER_VALUES };
  for (const counter of counters) {
    values[counter.key] = counter.value ?? 0;
  }
  return values;
}

async function persistCounter(counter: ICounterSetting): Promise<void> {
  const idx = memoryCounters.findIndex((c) => c.key === counter.key);
  if (idx >= 0) memoryCounters[idx] = counter;
  else memoryCounters.push(counter);

  if (!isDbReady()) return;

  try {
    await CounterSetting.findOneAndUpdate(
      { key: counter.key },
      {
        key: counter.key,
        label: counter.label,
        value: counter.value,
        isActive: counter.isActive,
        incrementMin: counter.incrementMin,
        incrementMax: counter.incrementMax,
        intervalSeconds: counter.intervalSeconds,
        lastUpdatedAt: new Date(counter.lastUpdatedAt),
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn("[Counters] DB persist failed, using memory store:", err);
  }
}

export async function ensureCounters(): Promise<ICounterSetting[]> {
  if (isDbReady()) {
    try {
      const existing = await CounterSetting.find().lean();
      if (existing.length === 0) {
        await CounterSetting.insertMany(
          DEFAULT_COUNTER_DEFINITIONS.map((def) => ({
            ...createDefaultCounter(def),
            lastUpdatedAt: new Date(),
          }))
        );
      }

      const docs = await CounterSetting.find().sort({ key: 1 }).lean();
      memoryCounters = docs.map((doc) => toPlain(doc as unknown as ICounterSetting));
      return memoryCounters;
    } catch (err) {
      console.warn("[Counters] DB read failed, using memory store:", err);
    }
  }

  if (memoryCounters.length === 0) {
    memoryCounters = DEFAULT_COUNTER_DEFINITIONS.map(createDefaultCounter);
  }
  return memoryCounters;
}

function incrementValue(counter: ICounterSetting, amount: number): ICounterSetting {
  return {
    ...counter,
    value: counter.value + amount,
    lastUpdatedAt: nowIso(),
  };
}

async function tickCounters(): Promise<void> {
  if (!globalRunning) return;

  const counters = await ensureCounters();
  const now = Date.now();

  for (const counter of counters) {
    if (!counter.isActive) continue;

    const elapsed = now - new Date(counter.lastUpdatedAt).getTime();
    if (elapsed < counter.intervalSeconds * 1000) continue;

    const range = Math.max(0, counter.incrementMax - counter.incrementMin);
    const amount = range === 0 ? counter.incrementMin : counter.incrementMin + Math.floor(Math.random() * (range + 1));
    if (amount <= 0) continue;

    await persistCounter(incrementValue(counter, amount));
  }
}

function startTickLoop(): void {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    void tickCounters();
  }, 1000);
}

function stopTickLoop(): void {
  if (!tickInterval) return;
  clearInterval(tickInterval);
  tickInterval = null;
}

export async function getPublicCounters(): Promise<ICountersPublicResponse> {
  const counters = await ensureCounters();
  return {
    isRunning: globalRunning,
    values: valuesFromCounters(counters),
    updatedAt: nowIso(),
  };
}

export async function getAdminCounters(): Promise<ICountersAdminResponse> {
  const counters = await ensureCounters();
  return {
    isRunning: globalRunning,
    counters: counters.sort((a, b) => COUNTER_KEYS.indexOf(a.key) - COUNTER_KEYS.indexOf(b.key)),
  };
}

export async function launchCounters(): Promise<ICountersAdminResponse> {
  globalRunning = true;
  startTickLoop();

  const counters = await ensureCounters();
  await Promise.all(
    counters.map((counter) =>
      persistCounter({
        ...counter,
        isActive: true,
        lastUpdatedAt: nowIso(),
      })
    )
  );

  return getAdminCounters();
}

export async function stopCounters(): Promise<ICountersAdminResponse> {
  globalRunning = false;

  const counters = await ensureCounters();
  await Promise.all(
    counters.map((counter) =>
      persistCounter({
        ...counter,
        isActive: false,
        lastUpdatedAt: nowIso(),
      })
    )
  );

  stopTickLoop();
  return getAdminCounters();
}

export async function updateCounter(
  key: string,
  patch: Partial<Pick<ICounterSetting, "value" | "incrementMin" | "incrementMax" | "intervalSeconds" | "isActive">>
): Promise<ICounterSetting | null> {
  const counters = await ensureCounters();
  const existing = counters.find((c) => c.key === key);
  if (!existing) return null;

  const updated: ICounterSetting = {
    ...existing,
    ...patch,
    lastUpdatedAt: nowIso(),
  };

  await persistCounter(updated);
  return updated;
}

export async function initCounterService(): Promise<void> {
  await ensureCounters();
}

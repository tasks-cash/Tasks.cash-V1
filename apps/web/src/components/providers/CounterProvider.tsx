"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CounterKey, ICountersPublicResponse } from "@tasks-cash/types";
import { ZERO_COUNTER_VALUES } from "@tasks-cash/types";

interface CounterContextValue {
  values: Record<CounterKey, number>;
  isRunning: boolean;
  loading: boolean;
  getValue: (key: CounterKey) => number;
  refresh: () => Promise<void>;
}

const CounterContext = createContext<CounterContextValue | null>(null);

const POLL_MS = 3000;

async function fetchCounters(): Promise<ICountersPublicResponse> {
  try {
    const res = await fetch("/api/counters", { cache: "no-store" });
    const json = await res.json();
    if (json.success && json.data) return json.data as ICountersPublicResponse;
  } catch {
    /* fall through */
  }
  return {
    isRunning: false,
    values: { ...ZERO_COUNTER_VALUES },
    updatedAt: new Date(0).toISOString(),
  };
}

export function CounterProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<CounterKey, number>>({ ...ZERO_COUNTER_VALUES });
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchCounters();
    setValues(data.values);
    setIsRunning(data.isRunning);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const getValue = useCallback((key: CounterKey) => values[key] ?? 0, [values]);

  const contextValue = useMemo(
    () => ({ values, isRunning, loading, getValue, refresh }),
    [values, isRunning, loading, getValue, refresh]
  );

  return <CounterContext.Provider value={contextValue}>{children}</CounterContext.Provider>;
}

export function useLiveCounters(): CounterContextValue {
  const ctx = useContext(CounterContext);
  if (!ctx) {
    return {
      values: { ...ZERO_COUNTER_VALUES },
      isRunning: false,
      loading: false,
      getValue: () => 0,
      refresh: async () => {},
    };
  }
  return ctx;
}

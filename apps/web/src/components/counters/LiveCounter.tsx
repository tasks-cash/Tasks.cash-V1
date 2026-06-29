"use client";

import { AnimatedCounter } from "@/components/homepage/shared/AnimatedCounter";
import type { CounterKey } from "@tasks-cash/types";
import { useLiveCounters } from "@/components/providers/CounterProvider";

interface LiveCounterProps {
  counterKey: CounterKey;
  prefix?: string;
  suffix?: string;
  className?: string;
  showLiveBadge?: boolean;
}

export function LiveCounter({
  counterKey,
  prefix = "",
  suffix = "",
  className = "",
  showLiveBadge = false,
}: LiveCounterProps) {
  const { getValue, isRunning, loading } = useLiveCounters();
  const value = loading ? 0 : getValue(counterKey);

  return (
    <span className={className}>
      <AnimatedCounter target={value} prefix={prefix} suffix={suffix} live={false} />
      {showLiveBadge && isRunning && (
        <span className="ml-2 inline-flex items-center gap-1 text-[9px] text-emerald-400 uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      )}
    </span>
  );
}

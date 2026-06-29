"use client";

import { StatCard } from "@tasks-cash/ui";
import type { CounterKey } from "@tasks-cash/types";
import { useLiveCounters } from "@/components/providers/CounterProvider";

interface LiveStatCardProps {
  counterKey: CounterKey;
  label: string;
  icon?: string;
  glow?: "purple" | "gold" | "violet";
  prefix?: string;
}

export function LiveStatCard({ counterKey, label, icon, glow, prefix }: LiveStatCardProps) {
  const { getValue } = useLiveCounters();
  const value = getValue(counterKey);
  const display = prefix ? `${prefix}${value.toLocaleString()}` : value.toLocaleString();

  return <StatCard label={label} value={display} icon={icon} glow={glow} />;
}

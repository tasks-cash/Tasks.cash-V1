"use client";

import { GlowText, GlassCard, StatWidget, PortalButton } from "@tasks-cash/ui";
import { MotionReveal } from "@tasks-cash/ui";

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  stats?: { label: string; value: string | number; icon: string; glow?: "gold" | "purple" }[];
  children: React.ReactNode;
}

export function AdminPageShell({ title, subtitle, action, stats, children }: AdminPageShellProps) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <GlowText as="h1" variant="gold" className="text-3xl">{title}</GlowText>
          {subtitle && <p className="text-purple-300/60 text-sm mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <MotionReveal key={s.label} delay={i * 0.05}>
              <StatWidget label={s.label} value={s.value} icon={s.icon} glow={s.glow} />
            </MotionReveal>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

interface AdminTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}

export function AdminTable({ headers, rows }: AdminTableProps) {
  return (
    <GlassCard className="p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-purple-400/60 border-b border-purple-500/20">
            {headers.map((h) => (
              <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-purple-500/10 hover:bg-purple-950/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4 text-purple-200">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

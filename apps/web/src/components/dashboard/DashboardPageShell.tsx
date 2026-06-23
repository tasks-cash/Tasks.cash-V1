"use client";

import { GlowText, MotionReveal } from "@tasks-cash/ui";

interface DashboardPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardPageShell({ title, subtitle, action, children }: DashboardPageShellProps) {
  return (
    <div>
      <MotionReveal>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <GlowText as="h1" className="text-3xl">{title}</GlowText>
            {subtitle && <p className="text-purple-300/60 mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      </MotionReveal>
      {children}
    </div>
  );
}

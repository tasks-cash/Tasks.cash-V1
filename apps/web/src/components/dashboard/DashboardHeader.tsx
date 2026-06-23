"use client";

import { PageHeader } from "@tasks-cash/ui";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, badge, action }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex-1">
        <PageHeader title={title} subtitle={subtitle} badge={badge} className="mb-0 pb-0" showDivider={false} />
      </div>
      {action && <div className="shrink-0 pt-2">{action}</div>}
    </div>
  );
}

import React from "react";

interface StatWidgetProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
  glow?: "purple" | "gold";
}

/** Dashboard stat widget */
export function StatWidget({ label, value, icon, trend, glow = "purple" }: StatWidgetProps) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 backdrop-blur-xl",
        "bg-gradient-to-br from-purple-950/50 to-black/70",
        glow === "gold"
          ? "border-amber-400/25 shadow-glow-gold"
          : "border-purple-500/25 shadow-glow-purple",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-purple-400/60">{label}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-3xl font-black ${glow === "gold" ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
      {trend && <p className="mt-1 text-xs text-green-400">{trend}</p>}
    </div>
  );
}

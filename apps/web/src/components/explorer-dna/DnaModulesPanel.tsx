"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@tasks-cash/ui";
import type { IDNAModule } from "@tasks-cash/types";
import { cn } from "@/lib/utils";

interface DnaModulesPanelProps {
  modules: IDNAModule[];
}

export function DnaModulesPanel({ modules }: DnaModulesPanelProps) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  return (
    <section className="mb-10 md:mb-14">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">DNA Modules</p>
        <h2 className="text-2xl md:text-3xl font-black text-white">Your Explorer DNA Layers</h2>
        <p className="text-sm text-purple-300/55 mt-2">Expand each module to see what the platform has learned about you.</p>
      </div>

      <div className="space-y-3">
        {modules.map((mod) => {
          const isOpen = openId === mod.id;
          return (
            <GlassCard key={mod.id} glow={mod.completion >= 100 ? "gold" : "purple"} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : mod.id)}
                className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-purple-950/20 transition-colors"
              >
                <span className="text-2xl md:text-3xl">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-black text-white">{mod.name}</h3>
                    <span className="text-sm font-bold text-amber-400">{mod.completion}%</span>
                  </div>
                  <p className="text-xs text-purple-400/50 mt-0.5">
                    {mod.completedFields}/{mod.totalFields} fields · {mod.description}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-black/50 overflow-hidden border border-purple-500/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-amber-400 transition-all duration-700"
                      style={{ width: `${mod.completion}%` }}
                    />
                  </div>
                </div>
                <span className={cn("text-purple-400 transition-transform", isOpen && "rotate-180")}>▼</span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 md:px-5 pb-4 md:pb-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 border-t border-purple-500/10 pt-4">
                      {mod.fields.map((field) => (
                        <div
                          key={field.id}
                          className={cn(
                            "rounded-lg border p-3 text-sm",
                            field.completed
                              ? "border-emerald-400/20 bg-emerald-950/20"
                              : "border-purple-500/15 bg-black/30"
                          )}
                        >
                          <p className="text-[10px] uppercase tracking-wider text-purple-400/50">{field.label}</p>
                          <p className={cn("font-semibold mt-0.5", field.completed ? "text-white" : "text-purple-400/40")}>
                            {field.completed ? (Array.isArray(field.value) ? field.value.join(", ") : field.value) : "Not answered"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}

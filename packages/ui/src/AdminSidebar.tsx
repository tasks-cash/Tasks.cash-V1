"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import { GameButton } from "./GameButton";
import { cn } from "./lib/utils";

interface AdminNavItem {
  href: string;
  label: string;
  icon?: string;
}

interface AdminSidebarProps {
  items: AdminNavItem[];
  pathname?: string;
  onLogout?: () => void;
}

/** Admin command center sidebar */
export function AdminSidebar({ items, pathname = "", onLogout }: AdminSidebarProps) {
  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-purple-500/20 bg-black/70 backdrop-blur-2xl">
      <div className="p-6 border-b border-purple-500/10">
        <BrandLogo size="sm" href="/" />
        <p className="text-amber-400/60 text-[10px] uppercase tracking-[0.25em] mt-3 font-semibold">
          Command Center
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {items.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-purple-600/30 text-white border border-purple-400/40 shadow-glow-purple"
                    : "text-purple-300/70 hover:bg-purple-950/50 hover:text-amber-200 border border-transparent"
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </a>
            </motion.div>
          );
        })}
      </nav>
      {onLogout && (
        <div className="p-4 border-t border-purple-500/10">
          <GameButton variant="ghost" size="sm" className="w-full" onClick={onLogout}>
            Exit Command
          </GameButton>
        </div>
      )}
    </aside>
  );
}

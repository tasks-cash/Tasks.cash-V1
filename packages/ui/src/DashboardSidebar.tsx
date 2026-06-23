"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import { GameButton } from "./GameButton";
import { cn } from "./lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface DashboardSidebarProps {
  items: NavItem[];
  pathname?: string;
  subtitle?: string;
  onLogout?: () => void;
  footer?: React.ReactNode;
}

/** Player control center sidebar */
export function DashboardSidebar({ items, pathname = "", subtitle = "Explorer Command", onLogout, footer }: DashboardSidebarProps) {
  return (
    <aside className="hidden xl:flex w-72 flex-col border-r border-purple-500/20 bg-black/60 backdrop-blur-2xl">
      <div className="p-6 border-b border-purple-500/10">
        <BrandLogo size="sm" href="/" />
        <p className="text-purple-400/50 text-[10px] uppercase tracking-[0.25em] mt-3">{subtitle}</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item, i) => {
          const active = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-purple-600/40 to-violet-600/20 text-white border border-purple-400/40 shadow-glow-purple"
                    : "text-purple-300/70 hover:bg-purple-950/50 hover:text-amber-200 hover:border-purple-500/20 border border-transparent"
                )}
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                {item.label}
              </a>
            </motion.div>
          );
        })}
      </nav>
      {footer && <div className="p-4 border-t border-purple-500/10">{footer}</div>}
      {onLogout && (
        <div className="p-4 border-t border-purple-500/10">
          <GameButton variant="ghost" size="sm" className="w-full" onClick={onLogout} data-sound="logout">
            Logout
          </GameButton>
        </div>
      )}
    </aside>
  );
}

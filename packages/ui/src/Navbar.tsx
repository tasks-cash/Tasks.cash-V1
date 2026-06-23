"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "./BrandLogo";

interface NavLink {
  href: string;
  label: string;
}

interface NavbarProps {
  links: NavLink[];
  rightSlot?: React.ReactNode;
}

/** Portal-themed navigation with animated mobile menu */
export function Navbar({ links, rightSlot }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-purple-500/20 bg-black/80 backdrop-blur-2xl">
      <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo size="xs" href="/" animated={false} />

        <div className="hidden lg:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-purple-300/80 hover:text-amber-300 transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-purple-400 to-amber-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">{rightSlot}</div>
          <button
            type="button"
            aria-label="Toggle menu"
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg border border-purple-500/30 bg-purple-950/40"
            onClick={() => setOpen((v) => !v)}
          >
            <motion.span
              className="block h-0.5 w-6 bg-purple-300 origin-center"
              animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            />
            <motion.span
              className="block h-0.5 w-6 bg-purple-300"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
            />
            <motion.span
              className="block h-0.5 w-6 bg-purple-300 origin-center"
              animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-purple-500/20 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
              }}
              className="px-4 py-6 space-y-1"
            >
              <div className="flex justify-center pb-4 mb-4 border-b border-purple-500/20">
                <BrandLogo size="sm" href="/" animated={false} />
              </div>
              {links.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  variants={{
                    closed: { opacity: 0, x: -20 },
                    open: { opacity: 1, x: 0 },
                  }}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-purple-200 hover:bg-purple-900/40 hover:text-amber-300 transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
                className="flex flex-col gap-3 pt-4 border-t border-purple-500/20 md:hidden"
              >
                {rightSlot}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/premium/LoadingScreen";

/** Overlay loading screen — always keeps route children mounted to avoid layout/hydration issues */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[200]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

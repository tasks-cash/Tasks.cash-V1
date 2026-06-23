"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ParallaxBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

/** Parallax portal rings that shift with scroll */
export function ParallaxBackground({ children, className = "" }: ParallaxBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y: y1, opacity }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="portal-ring absolute left-1/4 top-20 h-96 w-96 -translate-x-1/2 opacity-10" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-purple-600/10 blur-[100px]" />
      </motion.div>
      <motion.div style={{ y: y2 }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 bottom-0 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/5 blur-[80px]" />
      </motion.div>
      {children}
    </div>
  );
}

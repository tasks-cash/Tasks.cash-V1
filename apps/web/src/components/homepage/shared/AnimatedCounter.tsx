"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  live?: boolean;
  liveVariance?: number;
  liveInterval?: number;
}

export function AnimatedCounter({
  target,
  duration = 2200,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
  live = false,
  liveVariance = 0,
  liveInterval = 4000,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);
  const [base, setBase] = useState(target);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setBase(target);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  useEffect(() => {
    if (!live || !inView || liveVariance <= 0) return;
    const id = setInterval(() => {
      setBase((prev) => {
        const delta = Math.floor(Math.random() * liveVariance * 2) - liveVariance;
        return Math.max(0, prev + delta);
      });
    }, liveInterval);
    return () => clearInterval(id);
  }, [live, inView, liveVariance, liveInterval]);

  const display = live && inView ? base : value;
  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.floor(display).toLocaleString();

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  );
}

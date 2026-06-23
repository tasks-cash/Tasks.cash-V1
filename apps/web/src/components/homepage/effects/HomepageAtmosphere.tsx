"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo } from "react";
import { ParticleField } from "@tasks-cash/ui";

/** Full-screen atmospheric effects: particles, fog, lightning, floating rocks, mouse parallax */
export function HomepageAtmosphere() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-30, 30]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-20, 20]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  const rocks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${8 + (i * 7.5) % 85}%`,
        top: `${10 + (i * 11) % 75}%`,
        size: 4 + (i % 4) * 3,
        duration: 8 + (i % 5) * 2,
        delay: i * 0.4,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <ParticleField count={55} />

      {/* Moving fog layers */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute inset-0"
      >
        <motion.div
          className="absolute -left-1/4 top-1/4 h-[600px] w-[800px] rounded-full bg-purple-900/20 blur-[120px]"
          animate={{ x: [0, 80, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-1/4 bottom-1/4 h-[500px] w-[700px] rounded-full bg-violet-800/15 blur-[100px]"
          animate={{ x: [0, -60, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Light rays */}
      <div className="homepage-light-rays absolute inset-0 opacity-30" />

      {/* Lightning flashes */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4 + i * 2.5, delay: i * 1.8 }}
        />
      ))}

      {/* Floating rocks */}
      {rocks.map((rock) => (
        <motion.div
          key={rock.id}
          className="absolute rounded-sm bg-gradient-to-br from-purple-900/40 to-black/60 border border-purple-500/20"
          style={{ left: rock.left, top: rock.top, width: rock.size, height: rock.size * 1.4 }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, 180, 360],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{ duration: rock.duration, repeat: Infinity, delay: rock.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Vignette */}
      <div className="homepage-vignette absolute inset-0" />
    </div>
  );
}

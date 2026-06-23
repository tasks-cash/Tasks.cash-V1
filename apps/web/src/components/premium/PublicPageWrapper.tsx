"use client";

import { FramerPage } from "@/components/motion/FramerMotion";
import { FloatingParticles } from "./FloatingParticles";
import { ParallaxBackground } from "./ParallaxBackground";

interface PublicPageWrapperProps {
  children: React.ReactNode;
  particles?: boolean;
}

/** Wraps public pages with cinematic effects */
export function PublicPageWrapper({ children, particles = true }: PublicPageWrapperProps) {
  return (
    <FramerPage>
      <div className="relative min-h-[60vh]">
        {particles && <FloatingParticles count={30} />}
        <ParallaxBackground>{children}</ParallaxBackground>
      </div>
    </FramerPage>
  );
}

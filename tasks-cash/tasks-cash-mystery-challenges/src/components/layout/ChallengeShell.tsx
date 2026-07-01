"use client";

import { PortalBackground } from "@/components/ui/PortalBackground";
import { MysteryNavbar } from "@/components/nav/MysteryNavbar";

interface ChallengeShellProps {
  children: React.ReactNode;
}

/** Shared full-width shell for all challenge routes */
export function ChallengeShell({ children }: ChallengeShellProps) {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-black">
      <PortalBackground />
      <MysteryNavbar />
      <main className="relative z-10 w-full">{children}</main>
    </div>
  );
}

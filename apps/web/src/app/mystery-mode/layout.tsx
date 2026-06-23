import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mystery Mode — Tasks.cash",
  description: "You don't browse missions. You discover them.",
  robots: { index: false, follow: false },
};

/** Full-screen layout — no dashboard sidebar, no public nav, darker vault atmosphere */
export default function MysteryModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mystery-mode-root relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* Suppress root portal background — vault is darker */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-[1] mystery-vault-fog pointer-events-none cinematic-vignette" aria-hidden />
      {children}
    </div>
  );
}

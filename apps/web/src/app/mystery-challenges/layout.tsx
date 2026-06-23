import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mystery Mode & Challenges — Tasks.cash",
  description: "Secret missions. Hidden rewards. Global challenges.",
  robots: { index: false, follow: false },
};

/** Full-screen focused experience — no dashboard or admin sidebar */
export default function MysteryChallengesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mystery-mode-root relative min-h-screen w-full overflow-x-hidden bg-black">
      <div className="fixed inset-0 z-0 bg-black pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-[1] mystery-vault-fog pointer-events-none cinematic-vignette" aria-hidden />
      {children}
    </div>
  );
}

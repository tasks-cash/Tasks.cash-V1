import type { Metadata } from "next";
import { Cinzel, Inter, Orbitron, Rajdhani } from "next/font/google";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { GameProvider } from "@/components/game/GameProvider";
import { PortalBackground } from "@tasks-cash/ui";
import "./globals.css";
import "../styles/game.css";
import "../styles/homepage.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
  display: "swap",
});
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["500", "700"],
  display: "swap",
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Tasks.cash — Enter the Portal",
  description: "Complete missions. Earn coins. Level up. Conquer the leaderboard.",
  keywords: ["tasks", "gamification", "missions", "rewards", "leaderboard"],
  icons: {
    icon: "/image/main_logo.png",
    apple: "/image/main_logo.png",
    shortcut: "/image/main_logo.png",
  },
  openGraph: {
    title: "Tasks.cash — Enter the Portal",
    description: "PLAY • COMPLETE • EARN — Premium gamified reward universe",
    images: [{ url: "/image/main_logo.png", width: 512, height: 512, alt: "Tasks.cash" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cinzel.variable} ${orbitron.variable} ${rajdhani.variable} min-h-screen w-full overflow-x-hidden bg-black font-sans text-white antialiased`}
      >
        <PortalBackground intensity="medium" />
        <GameProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </GameProvider>
      </body>
    </html>
  );
}

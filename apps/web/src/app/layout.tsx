import type { Metadata } from "next";
import { MAIN_APP_URL } from "@/config/env";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { GameProvider } from "@/components/game/GameProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { LocaleHtmlAttributes } from "@/i18n/LocaleHtmlAttributes";
import { PortalBackground } from "@tasks-cash/ui";
import "./globals.css";
import "../styles/game.css";
import "../styles/homepage.css";

export const metadata: Metadata = {
  metadataBase: new URL(MAIN_APP_URL),
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen w-full overflow-x-hidden bg-black font-sans text-white antialiased"
        suppressHydrationWarning
      >
        <PortalBackground intensity="medium" />
        <I18nProvider>
          <LocaleHtmlAttributes />
          <GameProvider>
            <LoadingProvider>{children}</LoadingProvider>
          </GameProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

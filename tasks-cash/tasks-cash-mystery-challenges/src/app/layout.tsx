import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "700", "900"] });

export const metadata: Metadata = {
  title: "Tasks.cash Mystery Challenges — Enter The Arena",
  description: "Join timed raids. Submit viral videos. Invite friends. Complete secret missions. Climb the rankings.",
  metadataBase: new URL("https://challenge.tasks.cash"),
  icons: { icon: "/image/main_logo.png", apple: "/image/main_logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${cinzel.variable} font-sans`}>{children}</body>
    </html>
  );
}

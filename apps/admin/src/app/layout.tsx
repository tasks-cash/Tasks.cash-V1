import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tasks.cash Admin — Command Center",
  description: "Admin command center for Tasks.cash platform management",
  icons: {
    icon: "/image/main_logo.png",
    apple: "/image/main_logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cinzel.variable} min-h-screen w-full overflow-x-hidden bg-black font-sans text-white antialiased`}
      >
        <div className="portal-bg fixed inset-0 -z-10 pointer-events-none" aria-hidden />
        {children}
      </body>
    </html>
  );
}

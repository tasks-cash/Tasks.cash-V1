import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          black: "#000000",
          purple: "#7c3aed",
          violet: "#a855f7",
          gold: "#d4af37",
          goldBright: "#fbbf24",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-purple": "0 0 30px rgba(124, 58, 237, 0.45), 0 0 80px rgba(124, 58, 237, 0.12)",
        "glow-gold": "0 0 30px rgba(212, 175, 55, 0.45), 0 0 80px rgba(251, 191, 36, 0.12)",
        "glow-violet": "0 0 40px rgba(168, 85, 247, 0.35)",
      },
      animation: {
        "portal-spin": "portalSpin 24s linear infinite",
        "pulse-gold": "pulseGold 2.5s ease-in-out infinite",
        "fog-drift": "fogDrift 18s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
      keyframes: {
        portalSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 35px rgba(251, 191, 36, 0.65)" },
        },
        fogDrift: {
          "0%, 100%": { transform: "translateX(0) scale(1)", opacity: "0.35" },
          "50%": { transform: "translateX(-4%) scale(1.05)", opacity: "0.55" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

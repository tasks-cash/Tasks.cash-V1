/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        portal: {
          purple: "#7c3aed",
          violet: "#a855f7",
          dark: "#000000",
          deep: "#0a0118",
          gold: "#d4af37",
          goldBright: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cinzel)", "Georgia", "serif"],
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(124, 58, 237, 0.45), 0 0 60px rgba(124, 58, 237, 0.12)",
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.45), 0 0 60px rgba(251, 191, 36, 0.12)",
        "glow-violet": "0 0 25px rgba(168, 85, 247, 0.4)",
      },
      animation: {
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "portal-spin": "portalSpin 20s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out both",
        "fade-up": "fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(251, 191, 36, 0.6)" },
        },
        portalSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        neonPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(124, 58, 237, 0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(168, 85, 247, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

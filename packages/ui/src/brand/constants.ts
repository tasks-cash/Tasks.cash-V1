/** Tasks.cash brand identity — extracted from main_logo.png */
export const BRAND = {
  name: "Tasks.cash",
  tagline: "PLAY • COMPLETE • EARN",
  logo: "/image/main_logo.png",
} as const;

export const BRAND_COLORS = {
  black: "#000000",
  blackDeep: "#0a0118",
  blackGlass: "rgba(8, 4, 18, 0.72)",
  purpleRoyal: "#6d28d9",
  purpleGlow: "#7c3aed",
  violetNeon: "#a855f7",
  violetElectric: "#c084fc",
  goldMetallic: "#d4af37",
  goldBright: "#fbbf24",
  goldBronze: "#b8860b",
  cosmicBlue: "#3b82f6",
  silver: "#e2e8f0",
} as const;

export const BRAND_GRADIENTS = {
  gold: "linear-gradient(135deg, #fbbf24 0%, #d4af37 45%, #b8860b 100%)",
  purple: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)",
  portal: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.35), transparent)",
  glass: "linear-gradient(135deg, rgba(109, 40, 217, 0.12) 0%, rgba(0, 0, 0, 0.65) 100%)",
} as const;

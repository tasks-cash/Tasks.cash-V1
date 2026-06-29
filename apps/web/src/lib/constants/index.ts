/** App-wide constants */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Tasks.cash";

export const BRAND_LOGO = "/image/main_logo.png";

export const ROUTES = {
  public: {
    home: "/",
    about: "/about",
    worlds: "/worlds",
    challenges: "/challenges",
    missions: "/missions",
    mysteryMissions: "/mystery-missions",
    treasure: "/treasure",
    rewards: "/rewards",
    leaderboards: "/leaderboards",
    community: "/community",
    marketplace: "/marketplace",
    store: "/marketplace",
    blog: "/blog",
    help: "/help",
    faq: "/faq",
    contact: "/contact",
    terms: "/terms",
    privacy: "/privacy",
    refund: "/refund",
    cookies: "/cookies",
  },
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    verifyEmail: "/verify-email",
  },
  mysteryMode: "/mystery-mode",
  mysteryChallenges: "/mystery-challenges",
  dashboard: {
    overview: "/dashboard",
    mysteryChallenges: "/mystery-challenges",
    missions: "/dashboard/missions",
    submitProof: "/dashboard/missions/submit",
    rewards: "/dashboard/rewards",
    wallet: "/dashboard/wallet",
    withdrawals: "/dashboard/withdrawals",
    referrals: "/dashboard/referrals",
    level: "/dashboard/level",
    leaderboard: "/dashboard/leaderboard",
    notifications: "/dashboard/notifications",
    profile: "/dashboard/profile",
    security: "/dashboard/security",
    support: "/dashboard/support",
  },
} as const;

export const MAIN_APP_DASHBOARD_URL = ROUTES.dashboard.overview;

/** Explorer DNA user page lives on the admin app port (:3001) */
export const EXPLORER_DNA_URL =
  process.env.NEXT_PUBLIC_EXPLORER_DNA_URL ?? "http://localhost:3001/explorer-dna";

export const GAME = {
  xpPerLevel: Number(process.env.XP_PER_LEVEL ?? 1000),
  coinMultiplier: Number(process.env.COIN_MULTIPLIER ?? 1),
  referralBonus: Number(process.env.REFERRAL_BONUS_COINS ?? 50),
  dailyBonus: Number(process.env.DAILY_BONUS_COINS ?? 25),
} as const;

/** Brand palette extracted from main_logo.png */
export const THEME = {
  black: "#000000",
  blackDeep: "#0a0118",
  purpleRoyal: "#6d28d9",
  purpleGlow: "#7c3aed",
  violetNeon: "#a855f7",
  goldMetallic: "#d4af37",
  goldBright: "#fbbf24",
  cosmicBlue: "#3b82f6",
} as const;

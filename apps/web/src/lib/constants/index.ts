/** App-wide constants */
import {
  ADMIN_APP_URL,
  CHALLENGE_APP_URL,
  EXPLORER_DNA_URL,
  MAIN_APP_DASHBOARD_URL,
  MAIN_APP_URL,
  ROUTES as CROSS_APP_ROUTES,
} from "@/config/routes";

export {
  ADMIN_APP_URL,
  CHALLENGE_APP_URL,
  EXPLORER_DNA_URL,
  MAIN_APP_DASHBOARD_URL,
  MAIN_APP_URL,
};

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Tasks.cash";

export const BRAND_LOGO = "/image/main_logo.png";

/** Same-app relative paths (main web app only) */
export const ROUTES = {
  public: {
    home: "/",
    about: "/about",
    worlds: "/worlds",
    challenges: CROSS_APP_ROUTES.challenge.hub,
    missions: "/missions",
    mysteryMissions: "/mystery-missions",
    treasure: "/treasure",
    rewards: CROSS_APP_ROUTES.challenge.rewards,
    leaderboards: CROSS_APP_ROUTES.challenge.leaderboards,
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
  mysteryMode: CROSS_APP_ROUTES.challenge.hub,
  mysteryChallenges: CROSS_APP_ROUTES.challenge.hub,
  dashboard: {
    overview: "/dashboard",
    mysteryChallenges: CROSS_APP_ROUTES.challenge.hub,
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
  challenge: CROSS_APP_ROUTES.challenge,
  admin: CROSS_APP_ROUTES.admin,
} as const;

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

import type { ContentAppKey } from "@tasks-cash/types";

export const CMS_APPS: { key: ContentAppKey; label: string; icon: string }[] = [
  { key: "main", label: "Main App", icon: "🌐" },
  { key: "challenge", label: "Challenge App", icon: "⚔️" },
  { key: "admin", label: "Admin App", icon: "🛡️" },
];

export const CMS_PAGES: Record<ContentAppKey, { key: string; label: string }[]> = {
  main: [
    { key: "home", label: "Home" },
    { key: "dashboard", label: "Dashboard" },
    { key: "login", label: "Login" },
    { key: "register", label: "Register" },
    { key: "profile", label: "Profile" },
    { key: "settings", label: "Settings" },
    { key: "wallet", label: "Wallet" },
    { key: "notifications", label: "Notifications" },
    { key: "referrals", label: "Referrals" },
    { key: "mystery-missions", label: "Mystery Missions" },
  ],
  challenge: [
    { key: "home", label: "Home / Arena" },
    { key: "video-hunter", label: "Video Hunter" },
    { key: "referral-arena", label: "Referral Arena" },
    { key: "identity-challenge", label: "Identity Challenge" },
    { key: "special-missions", label: "Special Missions" },
    { key: "raid-arena", label: "Raid Arena" },
    { key: "duel-arena", label: "Duel Arena" },
    { key: "mystery-vault", label: "Mystery Vault" },
    { key: "leaderboards", label: "Leaderboards" },
    { key: "rewards", label: "Rewards" },
    { key: "explorer-dna", label: "Explorer DNA" },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "content", label: "Content CMS" },
    { key: "settings", label: "Settings" },
  ],
};

export const CMS_SECTION_ORDER = [
  "hero",
  "stats",
  "cards",
  "forms",
  "table",
  "buttons",
  "messages",
  "empty_states",
  "errors",
  "nav",
  "main",
] as const;

export const CMS_SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  stats: "Stats",
  cards: "Cards",
  forms: "Forms",
  table: "Table",
  buttons: "Buttons",
  messages: "Messages",
  empty_states: "Empty States",
  errors: "Errors",
  nav: "Navigation",
  main: "General",
};

export const CMS_CONTENT_TYPES = [
  "title",
  "subtitle",
  "description",
  "button",
  "label",
  "placeholder",
  "empty_state",
  "error_message",
  "success_message",
  "badge",
  "nav",
  "notice",
] as const;

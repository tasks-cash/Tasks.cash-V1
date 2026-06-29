export type CounterKey =
  | "total_users"
  | "active_users"
  | "registered_explorers"
  | "videos_submitted"
  | "approved_videos"
  | "pending_videos"
  | "total_views_submitted"
  | "missions_completed"
  | "rewards_distributed"
  | "withdrawals_completed"
  | "active_challenges"
  | "youtube_links_submitted"
  | "tiktok_links_submitted"
  | "instagram_links_submitted"
  | "facebook_links_submitted"
  | "snapchat_links_submitted";

export interface ICounterSetting {
  key: CounterKey;
  label: string;
  value: number;
  isActive: boolean;
  incrementMin: number;
  incrementMax: number;
  intervalSeconds: number;
  lastUpdatedAt: string;
}

export interface ICountersPublicResponse {
  isRunning: boolean;
  values: Record<CounterKey, number>;
  updatedAt: string;
}

export interface ICountersAdminResponse {
  isRunning: boolean;
  counters: ICounterSetting[];
}

export const COUNTER_KEYS: CounterKey[] = [
  "total_users",
  "active_users",
  "registered_explorers",
  "videos_submitted",
  "approved_videos",
  "pending_videos",
  "total_views_submitted",
  "missions_completed",
  "rewards_distributed",
  "withdrawals_completed",
  "active_challenges",
  "youtube_links_submitted",
  "tiktok_links_submitted",
  "instagram_links_submitted",
  "facebook_links_submitted",
  "snapchat_links_submitted",
];

export interface ICounterDefinition {
  key: CounterKey;
  label: string;
  incrementMin: number;
  incrementMax: number;
  intervalSeconds: number;
}

export const DEFAULT_COUNTER_DEFINITIONS: ICounterDefinition[] = [
  { key: "total_users", label: "Total Users", incrementMin: 1, incrementMax: 4, intervalSeconds: 4 },
  { key: "active_users", label: "Active Users", incrementMin: 1, incrementMax: 3, intervalSeconds: 3 },
  { key: "registered_explorers", label: "Registered Explorers", incrementMin: 1, incrementMax: 5, intervalSeconds: 5 },
  { key: "videos_submitted", label: "Videos Submitted", incrementMin: 1, incrementMax: 2, intervalSeconds: 6 },
  { key: "approved_videos", label: "Approved Videos", incrementMin: 1, incrementMax: 2, intervalSeconds: 8 },
  { key: "pending_videos", label: "Pending Videos", incrementMin: 0, incrementMax: 1, intervalSeconds: 10 },
  { key: "total_views_submitted", label: "Total Views Submitted", incrementMin: 50, incrementMax: 250, intervalSeconds: 4 },
  { key: "missions_completed", label: "Missions Completed", incrementMin: 1, incrementMax: 3, intervalSeconds: 5 },
  { key: "rewards_distributed", label: "Rewards Distributed", incrementMin: 1, incrementMax: 4, intervalSeconds: 6 },
  { key: "withdrawals_completed", label: "Withdrawals Completed", incrementMin: 0, incrementMax: 1, intervalSeconds: 12 },
  { key: "active_challenges", label: "Active Challenges", incrementMin: 0, incrementMax: 1, intervalSeconds: 15 },
  { key: "youtube_links_submitted", label: "YouTube Links Submitted", incrementMin: 1, incrementMax: 3, intervalSeconds: 5 },
  { key: "tiktok_links_submitted", label: "TikTok Links Submitted", incrementMin: 1, incrementMax: 3, intervalSeconds: 5 },
  { key: "instagram_links_submitted", label: "Instagram Links Submitted", incrementMin: 1, incrementMax: 2, intervalSeconds: 6 },
  { key: "facebook_links_submitted", label: "Facebook Links Submitted", incrementMin: 1, incrementMax: 2, intervalSeconds: 7 },
  { key: "snapchat_links_submitted", label: "Snapchat Links Submitted", incrementMin: 0, incrementMax: 2, intervalSeconds: 8 },
];

export const ZERO_COUNTER_VALUES: Record<CounterKey, number> = DEFAULT_COUNTER_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.key] = 0;
    return acc;
  },
  {} as Record<CounterKey, number>
);

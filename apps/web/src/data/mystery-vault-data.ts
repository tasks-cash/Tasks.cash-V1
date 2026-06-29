export interface VaultNotification {
  id: string;
  message: string;
  isNew: boolean;
}

export interface LockedMystery {
  id: string;
  label: string;
  icon: string;
  unlockCondition: string;
}

export interface UnlockCondition {
  id: string;
  label: string;
  met: boolean;
}

export const VAULT_NOTIFICATIONS: VaultNotification[] = [
  { id: "vn1", message: "New Mystery Detected", isNew: true },
  { id: "vn2", message: "Hidden Map Fragment Found", isNew: true },
  { id: "vn3", message: "Secret Reward Available", isNew: true },
];

export const LOCKED_MYSTERIES: LockedMystery[] = [
  { id: "m1", label: "??? Secret Mission", icon: "❓", unlockCondition: "Reach Level 5" },
  { id: "m2", label: "??? Hidden Map", icon: "🗺️", unlockCondition: "Complete first mission" },
  { id: "m3", label: "??? Legendary Reward", icon: "👑", unlockCondition: "Win a raid" },
  { id: "m4", label: "??? Secret Raid", icon: "⚔️", unlockCondition: "Invite 3 friends" },
  { id: "m5", label: "??? Founder Trial", icon: "🔮", unlockCondition: "7-day login streak" },
];

export const UNLOCK_CONDITIONS: UnlockCondition[] = [
  { id: "c1", label: "Reach Level 5", met: true },
  { id: "c2", label: "Complete first mission", met: true },
  { id: "c3", label: "Win a raid", met: false },
  { id: "c4", label: "Invite 3 friends", met: false },
  { id: "c5", label: "7-day login streak", met: false },
];

/** One revealed mystery for animation demo */
export const REVEALED_MYSTERY = {
  id: "revealed-1",
  title: "Shadow Gate Trial",
  description: "A hidden path opens for explorers who prove their reach.",
  reward: "500 Gold + Vault Key",
};

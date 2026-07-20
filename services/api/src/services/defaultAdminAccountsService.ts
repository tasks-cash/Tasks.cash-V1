import bcrypt from "bcryptjs";
import { Admin, type AdminRole } from "../models/Admin";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Permission } from "../models/Permission";
import {
  SUPER_ADMIN_PERMISSIONS,
  SUPER_ADMIN_ROLE_NAME,
} from "../constants/superAdminPermissions";
import {
  STANDARD_ADMIN_PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
} from "../constants/adminPermissions";

const DEFAULT_PASSWORD = "1421998A";
const BCRYPT_ROUNDS = 12;

const DEFAULT_ADMIN_EMAILS = ["owner@tasks.cash", "admin@tasks.cash"] as const;

type DefaultAdminSpec = {
  email: string;
  username: string;
  role: AdminRole;
  readyLog: string;
};

const DEFAULT_ADMINS: DefaultAdminSpec[] = [
  {
    email: "owner@tasks.cash",
    username: "owner",
    role: "super_admin",
    readyLog: "✓ Super Admin ready: owner@tasks.cash",
  },
  {
    email: "admin@tasks.cash",
    username: "admin",
    role: "admin",
    readyLog: "✓ Admin ready: admin@tasks.cash",
  },
];

const PERMISSION_DEFINITIONS: Array<{ name: string; slug: string; description: string }> = [
  { name: "Full System Access", slug: "system.full_access", description: "Unrestricted access to all platform features" },
  { name: "Dashboard Access", slug: "dashboard.access", description: "Access admin dashboard" },
  { name: "User Management", slug: "users.manage", description: "Manage platform users" },
  { name: "Employee Management", slug: "employees.manage", description: "Manage employees" },
  { name: "Admin Management", slug: "admins.manage", description: "Manage admin accounts" },
  { name: "Role Management", slug: "roles.manage", description: "Manage roles and permissions" },
  { name: "Mission Management", slug: "missions.manage", description: "Manage missions" },
  { name: "Video Hunter Management", slug: "video_hunter.manage", description: "Manage Video Hunter challenges" },
  { name: "Raid Arena Management", slug: "raid_arena.manage", description: "Manage Raid Arena events" },
  { name: "Duel Arena Management", slug: "duel_arena.manage", description: "Manage Duel Arena" },
  { name: "Mystery Vault Management", slug: "mystery_vault.manage", description: "Manage Mystery Vault content" },
  { name: "Rewards Management", slug: "rewards.manage", description: "Manage rewards and payouts" },
  { name: "Referral Management", slug: "referrals.manage", description: "Manage referral program" },
  { name: "Counters Management", slug: "counters.manage", description: "Manage platform counters" },
  { name: "Settings Management", slug: "settings.manage", description: "Manage platform settings" },
  { name: "Database Management", slug: "database.manage", description: "Database administration tools" },
  { name: "System Logs", slug: "system_logs.view", description: "View system audit logs" },
  { name: "Notifications", slug: "notifications.manage", description: "Manage notifications" },
  { name: "Environment Settings", slug: "environment.manage", description: "Manage environment configuration" },
  { name: "API Management", slug: "api.manage", description: "Manage API keys and endpoints" },
  { name: "Content Cache Read", slug: "content.cache.read", description: "Inspect page content cache metadata" },
  { name: "Content Cache Invalidate", slug: "content.cache.invalidate", description: "Invalidate page content cache entries" },
  { name: "Content Cache Rebuild", slug: "content.cache.rebuild", description: "Force-rebuild page content cache entries" },
  { name: "Campaign Read", slug: "campaign.read", description: "View domain campaigns" },
  { name: "Campaign Write", slug: "campaign.write", description: "Create and update domain campaigns" },
  { name: "Campaign Publish", slug: "campaign.publish", description: "Publish domain campaigns" },
  { name: "Campaign Archive", slug: "campaign.archive", description: "Archive or soft-delete domain campaigns" },
  { name: "Challenge Read", slug: "challenge.read", description: "View domain challenges" },
  { name: "Challenge Write", slug: "challenge.write", description: "Manage domain challenges" },
  { name: "Mission Write", slug: "mission.write", description: "Manage domain missions" },
  { name: "Submission Review", slug: "submission.review", description: "Review domain submissions" },
  { name: "Submission Approve", slug: "submission.approve", description: "Approve domain submissions" },
  { name: "Submission Reject", slug: "submission.reject", description: "Reject domain submissions" },
  { name: "Reward Issue", slug: "reward.issue", description: "Issue domain rewards via wallet ledger" },
  { name: "Reward Reverse", slug: "reward.reverse", description: "Reverse issued domain rewards" },
  { name: "Wallet View", slug: "wallet.view", description: "View domain wallets and ledger" },
  { name: "Wallet Adjust", slug: "wallet.adjust", description: "Post admin wallet adjustments" },
  { name: "Leaderboard Manage", slug: "leaderboard.manage", description: "Rebuild and snapshot leaderboards" },
  { name: "Season Manage", slug: "season.manage", description: "Manage seasons" },
  { name: "Notification Manage", slug: "notification.manage", description: "Manage domain notifications" },
  { name: "Analytics Read", slug: "analytics.read", description: "Read analytics events and counters" },
];

async function ensurePermissionDocuments(): Promise<void> {
  for (const def of PERMISSION_DEFINITIONS) {
    await Permission.updateOne(
      { slug: def.slug },
      { $setOnInsert: { name: def.name, slug: def.slug, description: def.description } },
      { upsert: true }
    );
  }

  await Role.updateOne(
    { slug: "super_admin" },
    {
      $set: {
        name: SUPER_ADMIN_ROLE_NAME,
        permissions: [...SUPER_ADMIN_PERMISSIONS],
      },
      $setOnInsert: { slug: "super_admin" },
    },
    { upsert: true }
  );

  await Role.updateOne(
    { slug: "admin" },
    {
      $set: {
        name: "Admin",
        permissions: [...STANDARD_ADMIN_PERMISSIONS],
      },
      $setOnInsert: { slug: "admin" },
    },
    { upsert: true }
  );
}

async function ensureAdminAccount(spec: DefaultAdminSpec, passwordHash: string): Promise<void> {
  const email = spec.email.toLowerCase().trim();
  const existing = await Admin.findOne({ email });

  const fields = {
    username: spec.username,
    role: spec.role,
    status: "active" as const,
    passwordHash,
  };

  if (existing) {
    await Admin.updateOne({ _id: existing._id }, { $set: fields });
    console.log(`${spec.readyLog} (passwordHash reset)`);
    return;
  }

  const usernameTaken = await Admin.findOne({ username: spec.username });
  const username = usernameTaken ? `${spec.username}_${Date.now().toString(36)}` : spec.username;

  await Admin.create({
    email,
    username,
    role: fields.role,
    status: fields.status,
    passwordHash: fields.passwordHash,
  });
  console.log(spec.readyLog);
}

/** Remove legacy admin rows from User collection — admins live in Admin only. */
async function removeLegacyAdminUsers(): Promise<void> {
  const result = await User.deleteMany({ email: { $in: [...DEFAULT_ADMIN_EMAILS] } });
  if (result.deletedCount > 0) {
    console.log(`[AdminBootstrap] Removed ${result.deletedCount} legacy admin user(s) from User collection`);
  }
}

/**
 * Idempotent bootstrap for default Super Admin and Admin accounts in Admin collection.
 * Safe to run on every API startup and from the seed script.
 */
export async function ensureDefaultAdminAccounts(): Promise<void> {
  await ensurePermissionDocuments();
  await removeLegacyAdminUsers();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  for (const account of DEFAULT_ADMINS) {
    await ensureAdminAccount(account, passwordHash);
  }
}

/** @deprecated Use ensureDefaultAdminAccounts */
export async function ensureSuperAdmin(): Promise<void> {
  await ensureDefaultAdminAccounts();
}

export { SUPER_ADMIN_ONLY_PERMISSIONS };

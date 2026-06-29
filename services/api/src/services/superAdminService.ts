import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Permission } from "../models/Permission";
import { generateReferralCode } from "@tasks-cash/utils";
import {
  SUPER_ADMIN_PERMISSIONS,
  SUPER_ADMIN_ROLE_NAME,
} from "../constants/superAdminPermissions";

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
}

/**
 * Idempotent bootstrap for the platform owner / Super Admin account.
 * Password is read from SUPER_ADMIN_PASSWORD env only — never hardcoded in app code.
 */
export async function ensureSuperAdmin(): Promise<void> {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "owner@tasks.cash").toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const username = (process.env.SUPER_ADMIN_USERNAME ?? "TasksOwner").trim();

  if (!password) {
    console.warn("[SuperAdmin] SUPER_ADMIN_PASSWORD not set — skipping owner account bootstrap");
    return;
  }

  await ensurePermissionDocuments();

  const superAdminFields = {
    role: "admin" as const,
    adminRole: SUPER_ADMIN_ROLE_NAME,
    isSuperAdmin: true,
    isOwner: true,
    isVerified: true,
    status: "active" as const,
    permissions: [...SUPER_ADMIN_PERMISSIONS],
  };

  const existing = await User.findOne({ email });

  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: superAdminFields });
    console.log(`[SuperAdmin] Existing account promoted to Super Admin: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let referralCode = generateReferralCode(username);
  let suffix = 0;
  while (await User.findOne({ referralCode })) {
    suffix += 1;
    referralCode = generateReferralCode(`${username}${suffix}`);
  }

  await User.create({
    username,
    email,
    passwordHash,
    referralCode,
    badges: [SUPER_ADMIN_ROLE_NAME, "Owner"],
    coins: 0,
    xp: 0,
    level: 1,
    ...superAdminFields,
  });

  console.log(`[SuperAdmin] Owner account created: ${email}`);
}

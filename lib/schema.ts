import { pgTable, uuid, text, timestamp, numeric, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), email: text("email").notNull().unique(), name: text("name"), passwordHash: text("password_hash"), googleId: text("google_id").unique(), avatarUrl: text("avatar_url"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  referralCode: text("referral_code").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), tokenHash: text("token_hash").notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ userIdIdx: index("sessions_user_id_idx").on(table.userId), expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt) }));
export const wallets = pgTable("wallets", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cpxTransactions = pgTable("cpx_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offerId: text("offer_id"),
  status: text("status").notNull().default("completed"),
  type: text("type"),
  amountLocal: numeric("amount_local", { precision: 12, scale: 2 }).notNull(),
  amountUsd: numeric("amount_usd", { precision: 12, scale: 4 }),
  ipClick: text("ip_click"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("cpx_transactions_user_id_idx").on(table.userId),
  statusIdx: index("cpx_transactions_status_idx").on(table.status),
}));


export const surveyAttempts = pgTable("survey_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offerId: text("offer_id").notNull(),
  status: text("status").notNull().default("started"),
  type: text("type"),
  transactionId: text("transaction_id").unique(),
  amountLocal: numeric("amount_local", { precision: 12, scale: 2 }),
  amountUsd: numeric("amount_usd", { precision: 12, scale: 4 }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("survey_attempts_user_id_idx").on(table.userId),
  offerIdIdx: index("survey_attempts_offer_id_idx").on(table.offerId),
  statusIdx: index("survey_attempts_status_idx").on(table.status),
  startedAtIdx: index("survey_attempts_started_at_idx").on(table.startedAt),
}));

export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USDT"),
  payoutAddress: text("payout_address").notNull(),
  status: text("status").notNull().default("pending"),
  provider: text("provider").notNull().default("faucetpay"),
  providerPayoutId: text("provider_payout_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("withdrawals_user_id_idx").on(table.userId),
  statusIdx: index("withdrawals_status_idx").on(table.status),
}));

export const telegramCodes = pgTable("telegram_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  reward: numeric("reward", { precision: 12, scale: 4 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const telegramCodeRedemptions = pgTable("telegram_code_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  codeId: uuid("code_id")
    .notNull()
    .references(() => telegramCodes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reward: numeric("reward", { precision: 12, scale: 4 }).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeUserUnique: uniqueIndex("telegram_code_user_unique").on(table.codeId, table.userId),
  codeIdIdx: index("telegram_code_redemptions_code_id_idx").on(table.codeId),
  userIdIdx: index("telegram_code_redemptions_user_id_idx").on(table.userId),
}));


export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerUserId: uuid("referrer_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredUserId: uuid("referred_user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  referrerUserIdIdx: index("referrals_referrer_user_id_idx").on(table.referrerUserId),
  statusIdx: index("referrals_status_idx").on(table.status),
}));

export const referralRewards = pgTable("referral_rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  milestone: numeric("milestone", { precision: 10, scale: 0 }).notNull(),
  rewardUsd: numeric("reward_usd", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userMilestoneUnique: uniqueIndex("referral_rewards_user_milestone_unique")
    .on(table.userId, table.milestone),
  userIdIdx: index("referral_rewards_user_id_idx").on(table.userId),
}));


export const dailyTasks = pgTable("daily_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardUsd: numeric("reward_usd", { precision: 12, scale: 2 }).notNull(),
  audience: text("audience").notNull().default("all"),
  actionUrl: text("action_url"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  startsAtIdx: index("daily_tasks_starts_at_idx").on(table.startsAt),
  expiresAtIdx: index("daily_tasks_expires_at_idx").on(table.expiresAt),
  audienceIdx: index("daily_tasks_audience_idx").on(table.audience),
}));

export const dailyTaskCompletions = pgTable("daily_task_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => dailyTasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardUsd: numeric("reward_usd", { precision: 12, scale: 2 }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskUserUnique: uniqueIndex("daily_task_completions_task_user_unique")
    .on(table.taskId, table.userId),
  taskIdIdx: index("daily_task_completions_task_id_idx").on(table.taskId),
  userIdIdx: index("daily_task_completions_user_id_idx").on(table.userId),
}));

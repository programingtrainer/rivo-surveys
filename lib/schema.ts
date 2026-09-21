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

export const telegramAccounts = pgTable("telegram_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  telegramUserId: text("telegram_user_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  telegramUserIdIdx: index("telegram_accounts_telegram_user_id_idx").on(table.telegramUserId),
}));

export const telegramLinkTokens = pgTable("telegram_link_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("telegram_link_tokens_user_id_idx").on(table.userId),
  expiresAtIdx: index("telegram_link_tokens_expires_at_idx").on(table.expiresAt),
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
  verificationType: text("verification_type").notNull().default("manual"),
  verificationValue: text("verification_value"),
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
  verificationStatus: text("verification_status").notNull().default("pending"),
  evidenceId: text("evidence_id"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskUserUnique: uniqueIndex("daily_task_completions_task_user_unique")
    .on(table.taskId, table.userId),
  taskIdIdx: index("daily_task_completions_task_id_idx").on(table.taskId),
  userIdIdx: index("daily_task_completions_user_id_idx").on(table.userId),
}));


export const weeklyChallenges = pgTable("weekly_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  challengeType: text("challenge_type").notNull(),
  target: numeric("target", { precision: 12, scale: 2 }),
  rewardUsd: numeric("reward_usd", { precision: 12, scale: 2 }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  startsAtIdx: index("weekly_challenges_starts_at_idx").on(table.startsAt),
  expiresAtIdx: index("weekly_challenges_expires_at_idx").on(table.expiresAt),
  statusIdx: index("weekly_challenges_status_idx").on(table.status),
}));

export const weeklyChallengePrizes = pgTable("weekly_challenge_prizes", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => weeklyChallenges.id, { onDelete: "cascade" }),
  rank: numeric("rank", { precision: 10, scale: 0 }).notNull(),
  rewardUsd: numeric("reward_usd", { precision: 12, scale: 2 }).notNull(),
}, (table) => ({
  challengeRankUnique: uniqueIndex("weekly_challenge_prizes_challenge_rank_unique")
    .on(table.challengeId, table.rank),
  challengeIdIdx: index("weekly_challenge_prizes_challenge_id_idx")
    .on(table.challengeId),
}));

export const weeklyChallengeWinners = pgTable("weekly_challenge_winners", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => weeklyChallenges.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rank: numeric("rank", { precision: 10, scale: 0 }).notNull(),
  rewardUsd: numeric("reward_usd", { precision: 12, scale: 2 }).notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  challengeUserUnique: uniqueIndex("weekly_challenge_winners_challenge_user_unique")
    .on(table.challengeId, table.userId),
  challengeRankUnique: uniqueIndex("weekly_challenge_winners_challenge_rank_unique")
    .on(table.challengeId, table.rank),
  challengeIdIdx: index("weekly_challenge_winners_challenge_id_idx")
    .on(table.challengeId),
  userIdIdx: index("weekly_challenge_winners_user_id_idx")
    .on(table.userId),
}));

import { pgTable, uuid, text, timestamp, numeric, boolean, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), email: text("email").notNull().unique(), name: text("name"), passwordHash: text("password_hash"), googleId: text("google_id").unique(), avatarUrl: text("avatar_url"),
  isBlocked: boolean("is_blocked").notNull().default(false),
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

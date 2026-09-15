import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cpxTransactions, referrals, users, wallets, withdrawals } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";
import AdminUsers from "./AdminUsers";
import AppHeader from "../AppHeader";

const ADMIN_EMAIL = "gatapro901@gmail.com";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/dashboard");

  const nonAdmin = sql`${users.email} <> ${ADMIN_EMAIL}`;

  const surveyStats = db
    .select({
      userId: cpxTransactions.userId,
      totalSurveys: sql<number>`count(*)`.as("total_surveys"),
      successfulSurveys: sql<number>`count(*) filter (
        where lower(${cpxTransactions.status}) = 'completed'
      )`.as("successful_surveys"),
      failedSurveys: sql<number>`count(*) filter (
        where lower(${cpxTransactions.status}) in (
          'failed',
          'canceled',
          'cancelled',
          'reversed',
          'rejected'
        )
      )`.as("failed_surveys"),
      totalEarnedUsd: sql<string>`coalesce(
        sum(${cpxTransactions.amountUsd}) filter (
          where lower(${cpxTransactions.status}) = 'completed'
        ),
        0
      )`.as("total_earned_usd"),
    })
    .from(cpxTransactions)
    .groupBy(cpxTransactions.userId)
    .as("survey_stats");

  const [stats, walletStats, recentUsers] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        blocked: sql<number>`count(*) filter (where ${users.isBlocked}=true)`,
        active: sql<number>`count(*) filter (where ${users.isBlocked}=false)`,
      })
      .from(users)
      .where(nonAdmin),

    db
      .select({
        totalBalance: sql<string>`coalesce(sum(${wallets.balance}),0)`,
      })
      .from(wallets)
      .innerJoin(users, eq(wallets.userId, users.id))
      .where(nonAdmin),

    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isBlocked: users.isBlocked,
        createdAt: users.createdAt,

        balance: sql<string>`coalesce(${wallets.balance}, '0')`,

        totalSurveys: sql<number>`coalesce(${surveyStats.totalSurveys}, 0)`,
        successfulSurveys: sql<number>`coalesce(${surveyStats.successfulSurveys}, 0)`,
        failedSurveys: sql<number>`coalesce(${surveyStats.failedSurveys}, 0)`,
        totalEarnedUsd: sql<string>`coalesce(${surveyStats.totalEarnedUsd}, 0)`,

        successfulReferrals: sql<number>`(
          select count(*)
          from ${referrals}
          where ${referrals.referrerUserId} = ${users.id}
            and lower(${referrals.status}) = 'qualified'
        )`,

        withdrawalCount: sql<number>`(
          select count(*)
          from ${withdrawals}
          where ${withdrawals.userId} = ${users.id}
        )`,

        totalWithdrawn: sql<string>`coalesce((
          select sum(${withdrawals.netAmount})
          from ${withdrawals}
          where ${withdrawals.userId} = ${users.id}
            and lower(${withdrawals.status}) = 'paid'
        ), '0')`,
      })
      .from(users)
      .leftJoin(wallets, eq(wallets.userId, users.id))
      .leftJoin(surveyStats, eq(surveyStats.userId, users.id))
      .where(nonAdmin)
      .orderBy(desc(users.createdAt))
      .limit(100),
  ]);


  const total = Number(stats[0]?.total ?? 0);
  const blocked = Number(stats[0]?.blocked ?? 0);
  const active = Number(stats[0]?.active ?? 0);
  const balance = Number(walletStats[0]?.totalBalance ?? 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showAdmin />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Platform overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage accounts, monitor activity, and control platform operations.
          </p>
        </div>

        <section className="motion-stagger mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total users", total],
            ["Active users", active],
            ["Blocked users", blocked],
            ["Wallet balance", `$${balance.toFixed(2)}`],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="motion-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="motion-card mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
                Operations
              </p>
              <h3 className="mt-1 text-lg font-bold">
                Operations Center
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Review withdrawals, monitor transaction states, manage payouts,
                and handle operational actions from one place.
              </p>
            </div>

            <a
              href="/admin/operations"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Manage Operations
              <span className="ml-2">→</span>
            </a>
          </div>
        </section>

        <section className="motion-card mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
                Engagement
              </p>
              <h3 className="mt-1 text-lg font-bold">
                Telegram Daily Codes
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Create, schedule, edit, and remove daily Telegram reward codes
                for Rivo users.
              </p>
            </div>

            <a
              href="/admin/telegram-codes"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Manage Codes
              <span className="ml-2">→</span>
            </a>
          </div>
        </section>

        <section>
          <AdminUsers initialUsers={recentUsers} />
        </section>

        <p className="mt-6 text-xs text-slate-400">
          Administrator account is excluded from user-management counts and
          listings.
        </p>
      </div>
    </main>
  );
}

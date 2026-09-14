import AppHeader from "../AppHeader";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cpxTransactions, wallets } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export default async function DashboardPage() {
  const [user, admin] = await Promise.all([
    getCurrentUser(),
    isAdmin(),
  ]);

  const displayName =
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";

  let balance = "0.00";
  let completedSurveys = 0;
  let totalEarned = "0.00";

  if (user) {
    const [walletResult, statsResult] = await Promise.all([
      db
        .select({
          balance: wallets.balance,
        })
        .from(wallets)
        .where(eq(wallets.userId, user.id))
        .limit(1),

      db
        .select({
          completedSurveys: sql<number>`count(*) filter (
            where lower(${cpxTransactions.status}) = 'completed'
          )`.as("completed_surveys"),
          totalEarned: sql<string>`coalesce(
            sum(${cpxTransactions.amountUsd}) filter (
              where lower(${cpxTransactions.status}) = 'completed'
            ),
            0
          )`.as("total_earned"),
        })
        .from(cpxTransactions)
        .where(eq(cpxTransactions.userId, user.id)),
    ]);

    balance = String(walletResult[0]?.balance ?? "0.00");
    completedSurveys = Number(statsResult[0]?.completedSurveys ?? 0);
    totalEarned = String(statsResult[0]?.totalEarned ?? "0.00");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-gray-900">
      <AppHeader displayName={displayName} showAdmin={admin} />


      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl bg-black px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-gray-400">
              Welcome back
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Hello, {displayName}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
              Find available surveys, complete them, and build your
              rewards balance.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/surveys"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Find surveys
              </a>

              <a
                href="/wallet"
                className="rounded-xl border border-gray-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                View wallet
              </a>
            </div>
          </div>
        </section>

        <section className="motion-stagger mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="motion-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Available balance
              </p>

              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Wallet
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              ${balance}
            </p>

            <a
              href="/wallet"
              className="mt-4 inline-block text-sm font-semibold text-black hover:underline"
            >
              Manage wallet
            </a>
          </div>

          <div className="motion-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Completed surveys
              </p>

              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Activity
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              {completedSurveys}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Your completed surveys will appear here.
            </p>
          </div>

          <div className="motion-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total earned
              </p>

              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Rewards
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              ${totalEarned}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Your lifetime survey earnings.
            </p>
          </div>
        </section>

        <section className="motion-stagger mt-7 grid gap-6 lg:grid-cols-3">
          <div className="motion-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Get started
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Everything you need to start earning.
                </p>
              </div>
            </div>

            <div className="motion-stagger mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="/surveys"
                className="group rounded-xl border border-gray-200 p-5 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <p className="text-base font-semibold">
                  Available surveys
                </p>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  Browse surveys that are available for your account.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-black">
                  Browse surveys →
                </span>
              </a>

              <a
                href="/wallet"
                className="group rounded-xl border border-gray-200 p-5 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <p className="text-base font-semibold">
                  Your wallet
                </p>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  Check your balance and manage your rewards.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-black">
                  Open wallet →
                </span>
              </a>
            </div>
          </div>

          <div className="motion-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Account
            </h2>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Signed in as
              </p>

              <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                {user?.email || "Account"}
              </p>
            </div>

            <a
              href="/settings"
              className="mt-4 block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold transition hover:bg-gray-50"
            >
              Account settings
            </a>

            {admin && (
              <a
                href="/admin"
                className="mt-3 block w-full rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Open Admin Panel
              </a>
            )}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-gray-400">
          Rivo Surveys
        </footer>
      </div>
    </main>
  );
}

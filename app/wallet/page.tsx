import Link from "next/link";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets } from "@/lib/schema";

import WithdrawalForm from "./WithdrawalForm";
import AppHeader from "../AppHeader";
export default async function WalletPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const walletResult = await db
    .select({
      balance: wallets.balance,
    })
    .from(wallets)
    .where(eq(wallets.userId, user.id))
    .limit(1);

  const balance = Number(walletResult[0]?.balance ?? 0);
  const formattedBalance = balance.toFixed(2);

  const displayName =
    user.name?.trim() ||
    user.email.split("@")[0] ||
    "Rivo User";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111] rivo-wallet-enter">
      <AppHeader displayName={displayName} />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/40">
            Finance
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Wallet
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55 sm:text-base">
                Manage your Rivo Surveys balance, withdrawals, and payment
                activity.
              </p>
            </div>

            <Link
              href="/surveys"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:border-black/25 hover:bg-[#fafaf8]"
            >
              Earn more
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="relative overflow-hidden rounded-3xl bg-black p-7 text-white shadow-[0_16px_50px_rgba(0,0,0,0.12)] sm:p-9">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10" />

            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    Available balance
                  </p>

                  <p className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
                    ${formattedBalance}
                  </p>

                  <p className="mt-3 text-sm text-white/50">
                    Your current available Rivo balance
                  </p>
                </div>

                <div className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 sm:flex">
                  <span className="text-lg font-semibold">$</span>
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/45">
                    Available to withdraw
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    ${formattedBalance}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/45">
                    Pending rewards
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    $0.00
                  </p>
                </div>
              </div>
            </div>

          </section>

          <section className="motion-card rounded-3xl border border-black/10 bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
              Wallet status
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Ready when you are
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/55">
              Your balance is updated as eligible survey rewards are credited
              to your wallet.
            </p>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#fafaf8] p-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />

                <div>
                  <p className="text-sm font-semibold">
                    Wallet active
                  </p>

                  <p className="mt-1 text-xs text-black/45">
                    Your wallet is available for rewards.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/surveys"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
            >
              Find surveys
            </Link>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="motion-card rounded-3xl border border-black/10 bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Withdraw
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Cash out your balance
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  Withdraw your eligible Rivo balance directly to your
                  FaucetPay account.
                </p>
              </div>

              <div className="hidden rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-black/50 sm:block">
                FaucetPay
              </div>
            </div>

            <WithdrawalForm balance={balance} />
          </section>

          <section className="motion-card rounded-3xl border border-black/10 bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Activity
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Recent transactions
                </h2>
              </div>

              <span className="rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-black/45">
                0 transactions
              </span>
            </div>

            <div className="mt-7 rounded-2xl border border-dashed border-black/15 bg-[#fafaf8] px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white">
                <span className="text-lg font-semibold text-black/35">
                  $
                </span>
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                No transactions yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-black/45">
                Completed survey rewards and future wallet activity will appear
                here.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                How it works
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Your Rivo wallet
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/55">
                Survey rewards are credited to your wallet after applicable
                quality and eligibility checks.
              </p>
            </div>

            <div className="border-t border-black/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-sm font-semibold">
                01. Complete surveys
              </p>

              <p className="mt-2 text-xs leading-5 text-black/50">
                Participate in surveys available to your account and complete
                them according to the survey requirements.
              </p>
            </div>

            <div className="border-t border-black/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-sm font-semibold">
                02. Receive rewards
              </p>

              <p className="mt-2 text-xs leading-5 text-black/50">
                Eligible rewards are added to your Rivo wallet once the
                applicable checks are completed.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-14 border-t border-black/10 pt-7 text-xs text-black/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Rivo Surveys. All rights reserved.</p>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/docs" className="hover:text-black">
                Documentation
              </Link>

              <Link href="/terms" className="hover:text-black">
                Terms
              </Link>

              <Link href="/privacy" className="hover:text-black">
                Privacy
              </Link>

              <Link href="/acceptable-use" className="hover:text-black">
                Acceptable Use
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

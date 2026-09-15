"use client";

import { FormEvent, useState } from "react";
import AppHeader from "../../AppHeader";

const TELEGRAM_CHANNEL_URL = "https://t.me/+REUHwE2c3wFjMWU8";

type RedeemResponse = {
  success?: boolean;
  message?: string;
  reward?: string;
  balance?: string;
  error?: string;
};

export default function TelegramCodesPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RedeemResponse | null>(null);

  async function handleRedeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setResult({ error: "Please enter a code." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/challenges/telegram/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const data = (await response.json()) as RedeemResponse;

      if (!response.ok) {
        setResult({
          error: data.error || "Unable to redeem this code.",
        });
        return;
      }

      setCode("");
      setResult(data);
    } catch {
      setResult({
        error: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="motion-fade-up mb-8">
          <a
            href="/challenges"
            className="mb-5 inline-flex items-center text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <span className="mr-2">←</span>
            Back to Challenges
          </a>

          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Telegram Rewards
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Telegram Daily Codes
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Follow the Rivo Telegram channel to find the latest daily reward
              codes, then enter your code below to claim your reward.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-700">
                01
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Find today&apos;s code
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open the official Rivo Telegram channel and look for the
                current daily reward code.
              </p>
            </div>

            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Open Rivo on Telegram
              <span className="ml-2">↗</span>
            </a>

            <div className="my-7 h-px bg-slate-100" />

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-700">
                02
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Redeem your code
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the code exactly as shown in Telegram. Each active code
                can only be redeemed once per account.
              </p>
            </div>

            <form onSubmit={handleRedeem} className="mt-6">
              <label
                htmlFor="telegram-code"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Daily code
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="telegram-code"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter your code"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium uppercase tracking-wide outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-w-[130px] items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Checking..." : "Redeem Code"}
                </button>
              </div>
            </form>

            {result?.error ? (
              <div className="motion-fade-up mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
                {result.error}
              </div>
            ) : null}

            {result?.success ? (
              <div className="motion-fade-up mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">
                  {result.message || "Code redeemed successfully."}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                      Reward
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      ${result.reward}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                      New balance
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      ${result.balance}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="motion-card h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              How it works
            </p>

            <div className="motion-stagger mt-6 space-y-5">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Join the channel</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Open the Rivo Telegram channel and follow the daily posts.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Get the active code</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Use the code published for the current reward period.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Claim your reward</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Enter the code here and the reward is added to your Rivo
                    balance when the code is valid.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">
                Important
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Codes are time-limited. An expired code cannot be redeemed,
                even if you have not used it before.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

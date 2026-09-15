"use client";

import { useEffect, useMemo, useState } from "react";

type Milestone = {
  count: number;
  reward: number;
};

type ReferralData = {
  referralCode: string | null;
  referralLink: string | null;
  successfulReferrals: number;
  currentMilestone: Milestone | null;
  nextMilestone: Milestone | null;
  progress: number;
  milestones: Milestone[];
  reachedMilestones: Milestone[];
};

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReferralData() {
      try {
        const response = await fetch("/api/referrals", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load referral data");
        }

        const result = await response.json();

        if (active) {
          setData(result);
        }
      } catch {
        if (active) {
          setError("Unable to load your referral information.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReferralData();

    return () => {
      active = false;
    };
  }, []);

  const nextMilestone = data?.nextMilestone ?? null;

  const remaining = useMemo(() => {
    if (!data || !nextMilestone) return 0;

    return Math.max(
      0,
      nextMilestone.count - data.successfulReferrals
    );
  }, [data, nextMilestone]);

  async function copyReferralLink() {
    if (!data?.referralLink) return;

    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError("Unable to copy the referral link.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <a
            href="/challenges"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <span aria-hidden="true">←</span>
            Back to Challenges
          </a>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
            <div>
              <div className="mb-5 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Referral Program
              </div>

              <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Invite friends and earn more
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg">
                Share your personal referral link. When your friends
                complete a survey successfully, you move closer to the
                next referral reward.
              </p>

              <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    Your referral link
                  </span>

                  {data?.referralCode && (
                    <span className="text-xs font-medium text-gray-400">
                      Code: {data.referralCode}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="truncate text-sm text-gray-600">
                      {loading
                        ? "Loading your referral link..."
                        : data?.referralLink || "Referral link unavailable"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyReferralLink}
                    disabled={!data?.referralLink || loading}
                    className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-500">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Successful referrals
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    {loading ? "—" : data?.successfulReferrals ?? 0}
                  </span>
                  <span className="pb-1 text-sm text-gray-400">
                    friends
                  </span>
                </div>

                <div className="mt-7">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-500">
                      {nextMilestone
                        ? `${remaining} more to go`
                        : "All milestones completed"}
                    </span>

                    <span className="text-gray-700">
                      {loading ? "—" : `${data?.progress ?? 0}%`}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
                      style={{
                        width: `${data?.progress ?? 0}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Next reward
                    </span>

                    <span className="text-sm font-bold text-gray-900">
                      {nextMilestone
                        ? `${formatUsd(nextMilestone.reward)} at ${nextMilestone.count}`
                        : "Completed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
              How it works
            </p>

            <div className="mt-6 space-y-6">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <h2 className="font-semibold">Share your link</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Send your personal referral link to friends.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <h2 className="font-semibold">Your friend joins</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Your friend registers using your referral link.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <h2 className="font-semibold">A survey is completed</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    The referral becomes successful only after a
                    completed CPX survey.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Referral rewards
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Milestones
                </h2>
              </div>

              <span className="text-sm text-gray-400">
                Total reward
              </span>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
              {(data?.milestones ?? [
                { count: 1, reward: 0.02 },
                { count: 5, reward: 0.12 },
                { count: 20, reward: 0.30 },
                { count: 30, reward: 0.42 },
                { count: 50, reward: 0.85 },
                { count: 70, reward: 1.20 },
                { count: 100, reward: 5.00 },
              ]).map((milestone, index) => {
                const reached =
                  (data?.successfulReferrals ?? 0) >= milestone.count;

                const isNext =
                  !reached &&
                  data?.nextMilestone?.count === milestone.count;

                return (
                  <div
                    key={milestone.count}
                    className={`flex items-center justify-between gap-4 px-4 py-4 transition sm:px-5 ${
                      index !== 0 ? "border-t border-gray-100" : ""
                    } ${
                      reached
                        ? "bg-gray-50"
                        : isNext
                          ? "bg-blue-50/60"
                          : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                          reached
                            ? "bg-gray-900 text-white"
                            : isNext
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {reached ? "✓" : milestone.count}
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {milestone.count} successful referrals
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          {reached
                            ? "Milestone reached"
                            : isNext
                              ? "Next milestone"
                              : "Keep going"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-bold ${
                        reached
                          ? "text-gray-900"
                          : isNext
                            ? "text-blue-700"
                            : "text-gray-500"
                      }`}
                    >
                      {formatUsd(milestone.reward)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">Successful referrals only</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                A registration or link click does not count as a
                successful referral.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold">One referral per friend</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Each referred account can qualify only once.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold">Milestones are cumulative</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                You receive only the difference needed to reach each
                newly unlocked total reward.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

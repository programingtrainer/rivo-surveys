"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "../AppHeader";

type Survey = {
  id: string;
  loi: number;
  payout: number;
  payoutUsd: number;
  conversionRate: number;
  type: string | null;
  top: number;
  href: string | null;
};

function formatCoins(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getSurveyTitle(type: string | null) {
  switch (type) {
    case "need_qualification":
      return "Quick Opinion Survey";
    case "survey":
      return "Opinion Survey";
    case "offer":
      return "Special Offer";
    default:
      return "Opinion Survey";
  }
}

function SurveySkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-10 w-10 rounded-2xl bg-gray-200" />
      <div className="mt-5 h-5 w-2/3 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />
      <div className="mt-7 h-12 w-full rounded-2xl bg-gray-200" />
    </div>
  );
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadSurveys = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/surveys", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load surveys");
      }

      setSurveys(Array.isArray(data.surveys) ? data.surveys : []);
    } catch (err) {
      console.error(err);
      setError("We couldn't load the available surveys.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const totalPotential = surveys.reduce(
    (total, survey) => total + survey.payoutUsd,
    0
  );

  return (
    <main className="motion-fade-up min-h-screen bg-[#f7f8fa] text-gray-900">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live opportunities
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Paid Online Surveys
              <br />
              That Reward Your Opinion.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
              Find available paid surveys, share your opinions, and
              earn Rivo Coins for eligible completed research activities.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xs text-white/50">
                  Available
                </div>
                <div className="mt-0.5 text-lg font-bold">
                  {loading ? "—" : surveys.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xs text-white/50">
                  Potential earnings
                </div>
                <div className="mt-0.5 text-lg font-bold">
                  {loading
                    ? "—"
                    : `$${totalPotential.toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </section>

        {/* Section header */}
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                Marketplace
              </div>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Available Paid Surveys
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose an online survey that fits your time and start earning Rivo Coins.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadSurveys(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={refreshing ? "animate-spin" : ""}
              >
                ↻
              </span>

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-red-900">
                Unable to load surveys
              </p>
              <p className="mt-1 text-sm text-red-700">
                Please try again in a moment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadSurveys()}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="motion-stagger mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <SurveySkeleton />
            <SurveySkeleton />
            <SurveySkeleton />
            <SurveySkeleton />
            <SurveySkeleton />
            <SurveySkeleton />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && surveys.length === 0 && (
          <div className="mt-7 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              📋
            </div>

            <h3 className="mt-5 text-lg font-bold">
              No surveys available right now
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              New opportunities appear throughout the day.
              Check back shortly to find more surveys.
            </p>

            <button
              type="button"
              onClick={() => loadSurveys(true)}
              className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Check again
            </button>
          </div>
        )}

        {/* Survey cards */}
        {!loading && !error && surveys.length > 0 && (
          <div className="motion-stagger mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {surveys.map((survey) => (
              <article
                key={survey.id}
                className="motion-card group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
              >
                {/* Recommended badge */}
                {survey.top > 0 && (
                  <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                    <span>★</span>
                    Recommended
                  </div>
                )}

                {/* Icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                  📝
                </div>

                <div className="mt-5">
                  <h3 className="pr-20 text-lg font-bold tracking-tight text-gray-900">
                    {getSurveyTitle(survey.type)}
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-gray-500">
                    Share your opinion and earn rewards for your
                    time.
                  </p>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-[11px] font-medium text-gray-400">
                      Estimated time
                    </div>
                    <div className="mt-1 font-bold text-gray-900">
                      {survey.loi} min
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-[11px] font-medium text-gray-400">
                      Success rate
                    </div>
                    <div className="mt-1 font-bold text-gray-900">
                      {survey.conversionRate > 0
                        ? `${survey.conversionRate}%`
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Reward */}
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Reward
                      </div>

                      <div className="mt-1 text-2xl font-black tracking-tight">
                        {formatCoins(survey.payout)}
                        <span className="ml-1 text-sm font-bold text-gray-400">
                          Rivo Coins
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-gray-400">
                        Value
                      </div>
                      <div className="font-bold text-gray-900">
                        ${survey.payoutUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5">
                  {survey.href ? (
                    <a
                      href={survey.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-bold text-white transition group-hover:bg-gray-800"
                    >
                      Start survey
                      <span className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl bg-gray-200 px-5 py-3.5 text-sm font-bold text-gray-400"
                    >
                      Currently unavailable
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer note */}
        {!loading && surveys.length > 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 text-center text-xs leading-5 text-gray-500">
            Survey availability and rewards may change based on
            your profile and eligibility.
          </div>
        )}
      </div>
    
        <section className="mt-14 rounded-3xl border border-gray-200 bg-white px-6 py-10 shadow-sm sm:px-10">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
              About Rivo Surveys
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Earn rewards by completing online surveys
            </h2>

            <div className="mt-5 space-y-4 text-sm leading-7 text-gray-600 sm:text-base">
              <p>
                Rivo Surveys gives you access to online survey opportunities
                where you can share your opinions and earn Rivo Coins. Survey
                availability, completion requirements, and rewards can vary
                depending on the research opportunity and your eligibility.
              </p>

              <p>
                Looking for paid surveys online? Browse the available
                opportunities above, choose a survey that matches your profile,
                and follow the instructions provided by the research partner.
                When an eligible survey is completed successfully, your reward
                can be credited to your Rivo wallet.
              </p>

              <p>
                For more information, learn
                {" "}
                <a
                  href="/docs/getting-started"
                  className="font-semibold text-gray-900 underline underline-offset-4 hover:text-gray-600"
                >
                  how Rivo Surveys works
                </a>
                {" "}
                or review our
                {" "}
                <a
                  href="/rewards-policy"
                  className="font-semibold text-gray-900 underline underline-offset-4 hover:text-gray-600"
                >
                  rewards policy
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white px-6 py-10 shadow-sm sm:px-10">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
              Survey FAQ
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
              Frequently asked questions about paid surveys
            </h2>

            <div className="mt-7 space-y-3">
              <details className="rounded-2xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-gray-900">
                  What are paid online surveys?
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Paid online surveys are questionnaires used for market
                  research. Participants share opinions and feedback and may
                  receive rewards for eligible completed surveys.
                </p>
              </details>

              <details className="rounded-2xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-gray-900">
                  How do I earn rewards from surveys?
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Choose an available survey, complete the required questions,
                  and follow the survey provider's instructions. Eligible
                  completed activities can earn Rivo Coins.
                </p>
              </details>

              <details className="rounded-2xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-gray-900">
                  Are all surveys available to everyone?
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  No. Survey availability and eligibility can vary based on
                  factors such as the research requirements and the information
                  provided during qualification.
                </p>
              </details>

              <details className="rounded-2xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-gray-900">
                  Where can I see my survey rewards?
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Eligible rewards are reflected in your Rivo wallet. You can
                  visit the wallet page to review your balance and available
                  account options.
                </p>
              </details>
            </div>
          </div>
        </section>

      </main>
  );
}

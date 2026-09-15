"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "../AppHeader";

type ChallengeCard = {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  action: string;
  icon: React.ReactNode;
};

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 10h11" strokeLinecap="round" />
      <path d="m11 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 13v4M8 20h8M10 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="m21 4-3 16-6-5-3 3v-5L21 4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 13 8-6" strokeLinecap="round" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  );
}

function ReferralIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 9a3 3 0 1 1 0 6M16 16a5 5 0 0 1 4.5 3" strokeLinecap="round" />
    </svg>
  );
}

export default function ChallengesPage() {
  const [displayName, setDisplayName] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!mounted || !data?.user) return;

        setDisplayName(data.user.name || data.user.email || "");
        setAdmin(Boolean(data.user.isAdmin));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const challengeCards: ChallengeCard[] = [
    {
      href: "/challenges/weekly",
      title: "Weekly Challenges",
      description:
        "Compete through the week, complete successful surveys, climb the leaderboard, and qualify for the weekly reward.",
      eyebrow: "COMPETE",
      action: "View Challenges",
      icon: <TrophyIcon />,
    },
    {
      href: "/challenges/telegram",
      title: "Telegram Daily Codes",
      description:
        "Join the Rivo Telegram channel, find the daily promo code, and redeem it here for your daily reward.",
      eyebrow: "DAILY REWARD",
      action: "Enter Daily Code",
      icon: <TelegramIcon />,
    },
    {
      href: "/challenges/tasks",
      title: "Daily Tasks",
      description:
        "Complete simple daily activities and unlock the rewards available for the current day.",
      eyebrow: "DAILY TASKS",
      action: "View Tasks",
      icon: <TasksIcon />,
    },
    {
      href: "/challenges/referrals",
      title: "Referral & Invite",
      description:
        "Invite new members to Rivo and earn referral rewards when qualifying activity is completed.",
      eyebrow: "INVITE",
      action: "View Referrals",
      icon: <ReferralIcon />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-black">
      <AppHeader displayName={displayName} showAdmin={admin} />

      <main className="rivo-container pb-16 pt-8 sm:pt-10">
        <section className="page-transition page-transition-visible motion-card relative overflow-hidden rounded-[2rem] bg-black px-6 py-10 text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)] sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-white/[0.05] blur-3xl" />

          <div className="relative max-w-3xl motion-fade-up">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              Rivo Challenges
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Earn more beyond surveys.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Take part in challenges, daily activities, referral rewards, and
              special opportunities designed to give you more ways to earn Rivo.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 motion-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              Explore
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Choose your challenge
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55 sm:text-base">
              Each section has its own rules, rewards, and progress. Open a
              section below to get started.
            </p>
          </div>

          <div className="motion-stagger grid gap-5 md:grid-cols-2">
            {challengeCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="motion-card group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)] active:scale-[0.99] sm:p-7"
              >
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-black/[0.025] blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white transition-transform duration-300 group-hover:scale-105">
                      {card.icon}
                    </div>

                    <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-black/45">
                      {card.eyebrow}
                    </span>
                  </div>

                  <div className="mt-7">
                    <h3 className="text-xl font-semibold tracking-tight">
                      {card.title}
                    </h3>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-black/55">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
                    <span className="text-sm font-semibold">
                      {card.action}
                    </span>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-all duration-300 group-hover:bg-black group-hover:text-white">
                      <ArrowIcon />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="motion-card mt-10 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                More coming soon
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                New ways to earn are on the way
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
                Rivo Challenges will continue to expand with new activities and
                reward opportunities while keeping the experience simple and
                transparent.
              </p>
            </div>

            <Link
              href="/surveys"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-black/85 active:scale-[0.98]"
            >
              Browse Surveys
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "../../AppHeader";

type Task = {
  id: string;
  title: string;
  description: string;
  rewardUsd: string;
  actionUrl: string | null;
  startsAt: string;
  expiresAt: string;
  completed: boolean;
};

function formatRemaining(value: string) {
  const ms = new Date(value).getTime() - Date.now();

  if (ms <= 0) return "Expired";

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 24) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  }

  return `${hours}h ${minutes}m left`;
}

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/challenges/tasks", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function claim(task: Task) {
    setBusy(task.id);
    setMessage("");

    try {
      const response = await fetch("/api/challenges/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to claim reward.");
        return;
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, completed: true } : item
        )
      );

      setMessage(`Reward claimed: $${Number(data.reward).toFixed(2)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-black">
      <AppHeader />

      <main className="rivo-container pb-16 pt-8">
        <Link
          href="/challenges"
          className="text-sm font-semibold text-black/50 transition hover:text-black"
        >
          ← Back to Challenges
        </Link>

        <section className="page-transition page-transition-visible motion-card mt-6 overflow-hidden rounded-[2rem] bg-black px-6 py-10 text-white shadow-[0_24px_70px_rgba(0,0,0,.12)] sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-white/45">
            Daily Tasks
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple tasks. Extra rewards.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            Complete the available activities before they expire and claim the
            reward directly to your Rivo wallet.
          </p>
        </section>

        {message && (
          <div className="motion-fade-up mt-5 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-medium shadow-sm">
            {message}
          </div>
        )}

        <section className="motion-stagger mt-8 grid gap-5 md:grid-cols-2">
          {loading ? (
            [1, 2].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-3xl border border-black/10 bg-white"
              />
            ))
          ) : tasks.length === 0 ? (
            <div className="motion-card rounded-3xl border border-black/10 bg-white p-8 shadow-sm md:col-span-2">
              <h2 className="text-xl font-semibold">No tasks available</h2>
              <p className="mt-2 text-sm leading-6 text-black/50">
                Check back later for new daily opportunities.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <article
                key={task.id}
                className="motion-card group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,.08)]"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-black/[.035] blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.16em] text-black/35">
                        Daily Task
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">
                        {task.title}
                      </h2>
                    </div>

                    <span className="rounded-full bg-black px-3 py-1.5 text-sm font-bold text-white">
                      +${Number(task.rewardUsd).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-black/55">
                    {task.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
                    <span className="text-xs font-semibold text-black/45">
                      {formatRemaining(task.expiresAt)}
                    </span>

                    {task.completed ? (
                      <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        ✓ Reward claimed
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        {task.actionUrl && (
                          <a
                            href={task.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
                          >
                            Start
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={busy === task.id}
                          onClick={() => claim(task)}
                          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy === task.id ? "Claiming..." : "Claim Reward"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

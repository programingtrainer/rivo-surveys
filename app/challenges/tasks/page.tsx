"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "../../AppHeader";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  rewardUsd: string | number;
  actionUrl?: string | null;
  verificationType?: string | null;
  verificationValue?: string | null;
  completed?: boolean;
  verificationStatus?: string | null;
};

function money(value: string | number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function isAutomaticTask(task: Task) {
  return (
    task.verificationType === "telegram_membership" ||
    task.verificationType === "survey_complete" ||
    task.verificationType === "referral_qualified"
  );
}

function taskType(task: Task) {
  switch (task.verificationType) {
    case "telegram_membership":
      return "Telegram verification";
    case "survey_complete":
      return "Survey verification";
    case "referral_qualified":
      return "Referral verification";
    case "manual":
      return "Manual verification";
    case "external_action":
      return "External action";
    default:
      return "Reward task";
  }
}

function verificationMessage(task: Task, opened: boolean) {
  switch (task.verificationType) {
    case "telegram_membership":
      return "Join the Rivo Telegram community, then verify your membership.";
    case "survey_complete":
      return "Complete the required CPX survey. Rivo will verify the completion automatically.";
    case "referral_qualified":
      return "Complete the required referral target. Rivo will verify your referrals automatically.";
    case "manual":
      return "This task requires manual verification before the reward can be credited.";
    case "external_action":
      return opened
        ? "The external task has been opened. Automatic verification is not available for this task."
        : "Open the external task. Automatic verification is not available for this task.";
    default:
      return opened
        ? "Task opened. You can continue with the verification."
        : "Open the task and follow the instructions.";
  }
}

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("rivo-opened-tasks") || "{}",
      );

      if (saved && typeof saved === "object") {
        setOpened(saved);
      }
    } catch {}
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);

      const response = await fetch("/api/challenges/tasks", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load tasks");
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch {
      setNotice("Unable to load tasks right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();

    const timer = window.setInterval(loadTasks, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const available = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );

  const completed = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks],
  );

  function openTask(task: Task) {
    if (!task.actionUrl) {
      setNotice("This task does not have a link.");
      return;
    }

    const nextOpened = {
      ...opened,
      [task.id]: true,
    };

    setOpened(nextOpened);

    try {
      sessionStorage.setItem(
        "rivo-opened-tasks",
        JSON.stringify(nextOpened),
      );
    } catch {}

    window.open(task.actionUrl, "_blank", "noopener,noreferrer");
  }

  async function claimTask(task: Task) {
    if (!isAutomaticTask(task)) {
      setNotice(
        task.verificationType === "manual"
          ? "This task requires manual verification."
          : "This task does not support automatic verification yet.",
      );
      return;
    }

    try {
      setBusy(task.id);
      setNotice("");

      const response = await fetch("/api/challenges/tasks/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "The task could not be verified.",
        );
      }

      const credited =
        data.rewardCredited === true ||
        data.credited === true ||
        data.verificationStatus === "verified";

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                completed: credited,
                verificationStatus: credited
                  ? "verified"
                  : data.verificationStatus ?? item.verificationStatus,
              }
            : item,
        ),
      );

      setNotice(
        credited
          ? `${money(task.rewardUsd)} was added to your wallet.`
          : "The task was verified, but the reward has not been credited yet.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to verify this task.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/challenges";
            }}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            ← Back to Challenges
          </button>
        </div>

        <section className="overflow-hidden rounded-[28px] bg-[#111111] px-6 py-7 shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                Rivo Rewards
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Daily Tasks
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Complete simple tasks, verify your progress, and earn
                additional rewards.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-[115px] rounded-2xl bg-white/[0.07] px-4 py-3">
                <p className="text-xs font-medium text-slate-400">
                  Available
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {available.length}
                </p>
              </div>

              <div className="min-w-[115px] rounded-2xl bg-white/[0.07] px-4 py-3">
                <p className="text-xs font-medium text-slate-400">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {completed.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {notice && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
            {notice}
          </div>
        )}

        {loading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-[26px] bg-white shadow-sm"
              />
            ))}
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <section className="mt-6 rounded-[26px] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-500">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              No tasks available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              New rewards will appear here when tasks become available.
            </p>
          </section>
        )}

        {!loading && tasks.length > 0 && (
          <section className="mt-6 grid gap-5 md:grid-cols-2">
            {tasks.map((task) => {
              const automatic = isAutomaticTask(task);
              const hasOpened = !!opened[task.id];
              const isCompleted = !!task.completed;

              return (
                <article
                  key={task.id}
                  className={`relative rounded-[26px] border bg-white p-5 shadow-sm transition-all sm:p-6 ${
                    isCompleted
                      ? "border-emerald-200"
                      : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`absolute left-0 top-7 h-10 w-1 rounded-r-full ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-900"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-4 pl-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900">
                          {task.title}
                        </h2>

                        {isCompleted && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                            Completed
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {taskType(task)}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-slate-100 px-3.5 py-2.5 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Reward
                      </p>

                      <p className="text-lg font-black text-slate-900">
                        +{money(task.rewardUsd)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 pl-2 text-sm leading-6 text-slate-600">
                    {task.description ||
                      "Complete this task to earn an additional reward."}
                  </p>

                  {!isCompleted && (
                    <>
                      <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500">
                          {verificationMessage(task, hasOpened)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => openTask(task)}
                          disabled={!task.actionUrl}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {hasOpened ? "↗ Open Again" : "↗ Open Task"}
                        </button>

                        <button
                          type="button"
                          onClick={() => claimTask(task)}
                          disabled={busy === task.id || !automatic}
                          className="rounded-2xl bg-[#111111] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {busy === task.id
                            ? "Verifying..."
                            : automatic
                              ? "✓ Verify & Claim"
                              : task.verificationType === "manual"
                                ? "Manual Verification"
                                : "Verification Unavailable"}
                        </button>
                      </div>
                    </>
                  )}

                  {isCompleted && (
                    <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3.5 text-center text-sm font-bold text-emerald-700">
                      ✓ Reward credited to your wallet
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

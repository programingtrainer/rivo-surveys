"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string;
  rewardUsd: string;
  audience: string;
  actionUrl: string | null;
  verificationType: string;
  verificationValue: string | null;
  startsAt: string;
  expiresAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  rewardUsd: "",
  audience: "all",
  actionUrl: "",
  verificationType: "external_action",
  verificationValue: "",
  startsAt: "",
  expiresAt: "",
};

function localDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function audienceLabel(value: string) {
  if (value === "new") return "New users";
  if (value === "old") return "Old users";
  return "All users";
}

function verificationLabel(value: string) {
  if (value === "telegram_membership") return "Telegram membership";
  if (value === "survey_complete") return "Survey completed";
  if (value === "referral_qualified") return "Qualified referral";
  if (value === "manual") return "Manual verification";
  return "External action";
}

function verificationDescription(value: string) {
  if (value === "telegram_membership") {
    return "Rivo will check the user's linked Telegram account directly against the required Telegram group.";
  }

  if (value === "survey_complete") {
    return "Rivo checks for a verified completed survey associated with this user.";
  }

  if (value === "referral_qualified") {
    return "Rivo checks the user's qualified referral count.";
  }

  if (value === "manual") {
    return "This task requires a real verification workflow. The Complete button alone will never award the user.";
  }

  return "The URL is only for navigation. Opening it does not prove that the task was completed.";
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/admin/tasks", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks ?? []);
      } else {
        setMessage("Unable to load daily tasks.");
      }
    } catch {
      setMessage("Unable to load daily tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setMessage("");
    setOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);

    setForm({
      title: task.title,
      description: task.description,
      rewardUsd: String(task.rewardUsd),
      audience: task.audience,
      actionUrl: task.actionUrl ?? "",
      verificationType: task.verificationType ?? "external_action",
      verificationValue: task.verificationValue ?? "",
      startsAt: localDateTime(task.startsAt),
      expiresAt: localDateTime(task.expiresAt),
    });

    setMessage("");
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setMessage("");

    try {
      if (!form.title.trim()) {
        setMessage("Task name is required.");
        return;
      }

      if (!form.description.trim()) {
        setMessage("Task description is required.");
        return;
      }

      const reward = Number(form.rewardUsd);

      if (!Number.isFinite(reward) || reward <= 0) {
        setMessage("Reward must be greater than 0.");
        return;
      }

      if (!form.startsAt || !form.expiresAt) {
        setMessage("Start and end dates are required.");
        return;
      }

      const startsAt = new Date(form.startsAt);
      const expiresAt = new Date(form.expiresAt);

      if (
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(expiresAt.getTime())
      ) {
        setMessage("Invalid task schedule.");
        return;
      }

      if (expiresAt <= startsAt) {
        setMessage("End date must be after start date.");
        return;
      }

      if (
        form.verificationType === "telegram_membership" &&
        !form.verificationValue.trim() &&
        !window.confirm(
          "No Telegram chat was entered. The system will use the configured Rivo Telegram group. Continue?",
        )
      ) {
        return;
      }

      const endpoint = editing
        ? `/api/admin/tasks/${editing.id}`
        : "/api/admin/tasks";

      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          actionUrl: form.actionUrl.trim() || null,
          verificationValue: form.verificationValue.trim() || null,
          rewardUsd: reward,
          startsAt: startsAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to save task.");
        return;
      }

      setOpen(false);
      setForm(emptyForm);
      setEditing(null);

      await load();
    } catch {
      setMessage("Unable to save task.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(task: Task) {
    if (!window.confirm(`Delete "${task.title}" permanently?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await load();
      } else {
        const data = await response.json().catch(() => null);
        setMessage(data?.error || "Unable to delete task.");
      }
    } catch {
      setMessage("Unable to delete task.");
    }
  }

  const verificationType = form.verificationType;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-slate-400 transition hover:text-slate-700"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Daily Tasks
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create verified reward tasks with real server-side completion checks.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800"
          >
            + Add daily task
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 font-semibold">Task</th>
                  <th className="px-5 py-4 font-semibold">Verification</th>
                  <th className="px-5 py-4 font-semibold">Reward</th>
                  <th className="px-5 py-4 font-semibold">Audience</th>
                  <th className="px-5 py-4 font-semibold">Starts</th>
                  <th className="px-5 py-4 font-semibold">Expires</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      No tasks created yet.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold">{task.title}</div>
                        <div className="mt-1 max-w-xs truncate text-xs text-slate-400">
                          {task.description}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {verificationLabel(task.verificationType)}
                        </span>

                        {task.verificationValue && (
                          <div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                            {task.verificationValue}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        ${Number(task.rewardUsd).toFixed(2)}
                      </td>

                      <td className="px-5 py-4">
                        {audienceLabel(task.audience)}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(task.startsAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(task.expiresAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(task)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => remove(task)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="motion-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editing ? "Edit Task" : "Add daily task"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure the task, verification method, reward, and schedule.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-5">
                <label className="grid gap-2 text-sm font-semibold">
                  Task name

                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-slate-500"
                    placeholder="Example: Join the Rivo Telegram community"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Description

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={4}
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-slate-500"
                    placeholder="Explain exactly what the user should do."
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">
                    Reward (USD)

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.rewardUsd}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          rewardUsd: e.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-slate-500"
                      placeholder="0.10"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    Audience

                    <select
                      value={form.audience}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          audience: e.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-slate-500"
                    >
                      <option value="all">All users</option>
                      <option value="new">
                        New users — 7 days or less
                      </option>
                      <option value="old">
                        Old users — over 7 days
                      </option>
                    </select>
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="grid gap-2 text-sm font-semibold">
                    Verification method

                    <select
                      value={form.verificationType}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          verificationType: e.target.value,
                          verificationValue: "",
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-slate-500"
                    >
                      <option value="telegram_membership">
                        📱 Telegram Membership
                      </option>

                      <option value="survey_complete">
                        📋 Survey Complete
                      </option>

                      <option value="referral_qualified">
                        👥 Qualified Referral
                      </option>

                      <option value="external_action">
                        🔗 External Action
                      </option>

                      <option value="manual">
                        🔐 Manual Verification
                      </option>
                    </select>

                    <span className="text-xs font-normal leading-5 text-slate-500">
                      {verificationDescription(verificationType)}
                    </span>
                  </label>
                </div>

                {verificationType === "telegram_membership" && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <label className="grid gap-2 text-sm font-semibold text-sky-950">
                      Telegram group / chat

                      <input
                        value={form.verificationValue}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            verificationValue: e.target.value,
                          })
                        }
                        className="rounded-xl border border-sky-200 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-sky-500"
                        placeholder="Leave empty to use the configured Rivo Telegram group"
                      />

                      <span className="text-xs font-normal leading-5 text-sky-700">
                        You can use a Telegram chat ID such as
                        <span className="font-semibold">
                          {" "}
                          -1004443815828
                        </span>
                        . If empty, the server uses TELEGRAM_CHAT_ID.
                      </span>
                    </label>
                  </div>
                )}

                {verificationType === "survey_complete" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <label className="grid gap-2 text-sm font-semibold text-emerald-950">
                      Survey / Offer ID (optional)

                      <input
                        value={form.verificationValue}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            verificationValue: e.target.value,
                          })
                        }
                        className="rounded-xl border border-emerald-200 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-emerald-500"
                        placeholder="Leave empty to accept any qualifying completed survey"
                      />

                      <span className="text-xs font-normal leading-5 text-emerald-700">
                        The server checks the user's recorded successful survey
                        completion and does not trust the frontend button.
                      </span>
                    </label>
                  </div>
                )}

                {verificationType === "referral_qualified" && (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <label className="grid gap-2 text-sm font-semibold text-violet-950">
                      Required qualified referrals

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.verificationValue}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            verificationValue: e.target.value,
                          })
                        }
                        className="rounded-xl border border-violet-200 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-violet-500"
                        placeholder="1"
                      />

                      <span className="text-xs font-normal leading-5 text-violet-700">
                        Example: enter 3 to require three qualified referrals
                        during the task period.
                      </span>
                    </label>
                  </div>
                )}

                {verificationType === "external_action" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm font-semibold text-amber-950">
                      External action
                    </div>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      This method is navigation only. The system will not treat
                      opening the URL or pressing Complete as proof of completion.
                    </p>
                  </div>
                )}

                {verificationType === "manual" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Manual verification
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Manual tasks are not automatically rewarded. A future
                      verification/approval workflow must explicitly verify them.
                    </p>
                  </div>
                )}

                <label className="grid gap-2 text-sm font-semibold">
                  Action URL

                  <input
                    type="url"
                    value={form.actionUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        actionUrl: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-slate-500"
                    placeholder="https://example.com"
                  />

                  <span className="text-xs font-normal text-slate-400">
                    Navigation only. Opening this URL does not prove completion.
                  </span>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">
                    Start date & time

                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          startsAt: e.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    End date & time

                    <input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          expiresAt: e.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={save}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

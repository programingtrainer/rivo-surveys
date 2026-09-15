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
  startsAt: string;
  expiresAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  rewardUsd: "",
  audience: "all",
  actionUrl: "",
  startsAt: "",
  expiresAt: "",
};

function localDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function audienceLabel(value: string) {
  if (value === "new") return "New users";
  if (value === "old") return "Old users";
  return "All users";
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
    const response = await fetch("/api/admin/tasks", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setTasks(data.tasks ?? []);
    }
    setLoading(false);
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
      const endpoint = editing
        ? `/api/admin/tasks/${editing.id}`
        : "/api/admin/tasks";

      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rewardUsd: Number(form.rewardUsd),
          startsAt: new Date(form.startsAt).toISOString(),
          expiresAt: new Date(form.expiresAt).toISOString(),
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
    } finally {
      setBusy(false);
    }
  }

  async function remove(task: Task) {
    if (!window.confirm(`Delete "${task.title}" permanently?`)) return;

    const response = await fetch(`/api/admin/tasks/${task.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await load();
    } else {
      setMessage("Unable to delete task.");
    }
  }

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
              Create, schedule, edit, and remove reward tasks.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800"
          >
            + إضافة مهام
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 font-semibold">Task</th>
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
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
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
                      <td className="px-5 py-4 font-semibold">
                        ${Number(task.rewardUsd).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">{audienceLabel(task.audience)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(task.startsAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(task.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(task)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
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
                    {editing ? "Edit Task" : "إضافة مهام"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Configure the task, audience, reward, and schedule.
                  </p>
                </div>

                <button
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
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-slate-500"
                    placeholder="Example: Visit our community"
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
                        setForm({ ...form, rewardUsd: e.target.value })
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
                        setForm({ ...form, audience: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-slate-500"
                    >
                      <option value="all">All users</option>
                      <option value="new">New users — 7 days or less</option>
                      <option value="old">Old users — over 7 days</option>
                    </select>
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-semibold">
                  Action URL
                  <input
                    type="url"
                    value={form.actionUrl}
                    onChange={(e) =>
                      setForm({ ...form, actionUrl: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-slate-500"
                    placeholder="https://example.com"
                  />
                  <span className="text-xs font-normal text-slate-400">
                    Optional. Users can open it before claiming the reward.
                  </span>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">
                    Start date & time
                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) =>
                        setForm({ ...form, startsAt: e.target.value })
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
                        setForm({ ...form, expiresAt: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  disabled={busy}
                  onClick={save}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy ? "Saving..." : editing ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

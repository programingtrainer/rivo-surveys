"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../../AppHeader";

type TelegramCode = {
  id: string;
  code: string;
  reward: string;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  code: string;
  reward: string;
  startsAt: string;
  expiresAt: string;
};

const emptyForm: FormState = {
  code: "",
  reward: "",
  startsAt: "",
  expiresAt: "",
};

function toLocalInputValue(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatus(code: TelegramCode) {
  const now = Date.now();
  const start = new Date(code.startsAt).getTime();
  const end = new Date(code.expiresAt).getTime();

  if (now < start) {
    return {
      label: "Scheduled",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  if (now >= end) {
    return {
      label: "Expired",
      className: "bg-slate-100 text-slate-500 ring-slate-200",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
}

export default function TelegramCodesAdminPage() {
  const [codes, setCodes] = useState<TelegramCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/telegram-codes", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load Telegram codes.");
      }

      setCodes(Array.isArray(data?.codes) ? data.codes : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Telegram codes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCodes((current) => [...current]);
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const activeCount = useMemo(
    () =>
      codes.filter((code) => {
        const now = Date.now();
        return (
          now >= new Date(code.startsAt).getTime() &&
          now < new Date(code.expiresAt).getTime()
        );
      }).length,
    [codes]
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEditModal = (code: TelegramCode) => {
    setEditingId(code.id);
    setForm({
      code: code.code,
      reward: code.reward,
      startsAt: toLocalInputValue(code.startsAt),
      expiresAt: toLocalInputValue(code.expiresAt),
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "code" ? value.toUpperCase() : value,
    }));
  };

  const saveCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim() || !form.reward.trim()) {
      setError("Code and reward are required.");
      return;
    }

    if (!form.startsAt || !form.expiresAt) {
      setError("Start and expiration times are required.");
      return;
    }

    const start = new Date(form.startsAt);
    const expiry = new Date(form.expiresAt);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(expiry.getTime()) ||
      expiry <= start
    ) {
      setError("Expiration time must be after the start time.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const response = await fetch(
        editingId
          ? `/api/admin/telegram-codes/${editingId}`
          : "/api/admin/telegram-codes",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: form.code.trim(),
            reward: form.reward.trim(),
            startsAt: start.toISOString(),
            expiresAt: expiry.toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save Telegram code.");
      }

      await loadCodes();

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(
        editingId
          ? "Telegram code updated successfully."
          : "Telegram code created successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Telegram code."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCode = async (code: TelegramCode) => {
    const confirmed = window.confirm(
      `Delete the code "${code.code}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(code.id);
      setError("");
      setNotice("");

      const response = await fetch(
        `/api/admin/telegram-codes/${code.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete Telegram code.");
      }

      setCodes((current) => current.filter((item) => item.id !== code.id));
      setNotice(`Code "${code.code}" was deleted.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete Telegram code."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader showAdmin />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="motion-fade-up mb-6">
          <a
            href="/admin"
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <span className="mr-2">←</span>
            Back to Admin
          </a>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
                Engagement
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Telegram Daily Codes
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create and manage time-limited reward codes shared through
                the official Rivo Telegram channel.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Add Code
              <span className="ml-2 text-lg leading-none">+</span>
            </button>
          </div>
        </div>

        {notice ? (
          <div className="motion-fade-up mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="motion-fade-up mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <section className="motion-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="motion-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total codes</p>
            <p className="mt-2 text-3xl font-bold">{codes.length}</p>
          </div>

          <div className="motion-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Currently active</p>
            <p className="mt-2 text-3xl font-bold">{activeCount}</p>
          </div>

          <div className="motion-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Telegram channel</p>
            <a
              href="https://t.me/+REUHwE2c3wFjMWU8"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
            >
              Open channel
            </a>
          </div>
        </section>

        <section className="motion-card mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Code management</h2>
            <p className="mt-1 text-sm text-slate-500">
              Codes are only redeemable during their configured time window.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-lg font-semibold">No Telegram codes yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Create your first daily code to start rewarding users.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create First Code
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {codes.map((code) => {
                const status = getStatus(code);

                return (
                  <div
                    key={code.id}
                    className="motion-card px-5 py-5 transition hover:bg-slate-50/70"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <code className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-slate-900">
                            {code.code}
                          </code>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <span className="text-slate-400">Reward</span>
                            <p className="font-semibold text-slate-900">
                              {code.reward} Rivo
                            </p>
                          </div>

                          <div>
                            <span className="text-slate-400">Starts</span>
                            <p className="font-medium text-slate-700">
                              {formatDate(code.startsAt)}
                            </p>
                          </div>

                          <div>
                            <span className="text-slate-400">Expires</span>
                            <p className="font-medium text-slate-700">
                              {formatDate(code.expiresAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(code)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCode(code)}
                          disabled={deletingId === code.id}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                        >
                          {deletingId === code.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="motion-fade-up w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
                  {editingId ? "Edit code" : "New code"}
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {editingId
                    ? "Update Telegram Code"
                    : "Create Telegram Code"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCode} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Code
                </label>
                <input
                  value={form.code}
                  onChange={(event) =>
                    updateField("code", event.target.value)
                  }
                  placeholder="RIVO2026"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm uppercase outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Reward
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.reward}
                    onChange={(event) =>
                      updateField("reward", event.target.value)
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    Rivo
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Start time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) =>
                      updateField("startsAt", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Expiration time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateField("expiresAt", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                Users can redeem the code only after the start time and before
                the expiration time. Each user can redeem the same code once.
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string;
  isBlocked: boolean;
  createdAt: Date | string;
  balance: string | number;
  totalSurveys: number | string;
  successfulSurveys: number | string;
  outSurveys?: number | string;
  failedSurveys: number | string;
  startedSurveys?: number | string;
  withdrawalCount: number | string;
  totalWithdrawn: string | number;
  totalEarnedUsd: string | number;
  successfulReferrals: number | string;
  pendingReferrals?: number | string;
  referralEarnings?: string | number;
  referralCode?: string | null;
};

type Survey = {
  id: string;
  transactionId: string;
  offerId: string | null;
  status: string;
  type: string | null;
  amountLocal: string | number;
  amountUsd: string | number | null;
  ipClick: string | null;
  createdAt: string;
  updatedAt: string;
};

type Withdrawal = {
  id: string;
  amount: string | number;
  fee: string | number;
  netAmount: string | number;
  currency: string;
  payoutAddress: string;
  status: string;
  provider: string;
  providerPayoutId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type SurveyAttempt = {
  id: string;
  offerId: string;
  status: string;
  type: string | null;
  transactionId: string | null;
  amountLocal: string | number | null;
  amountUsd: string | number | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

type UserDetails = {
  user: User & {
    googleId: string | null;
    avatarUrl: string | null;
    updatedAt: string;
    paidWithdrawalCount: number | string;
    totalRequestedWithdrawals: string | number;
  };
  surveys: Survey[];
  surveyAttempts: SurveyAttempt[];
  withdrawals: Withdrawal[];
  referrals: {
    id: string;
    referredUserId: string;
    referredName: string | null;
    referredEmail: string;
    status: string;
    qualifiedAt: string | null;
    createdAt: string;
  }[];
};

function money(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return `$${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

function count(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function date(value: string | Date) {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toISOString().replace("T", " ").slice(0, 16);
}

function surveyResult(status: string, type?: string | null) {
  const s = status.toLowerCase();
  const t = String(type ?? "").toLowerCase();

  if (s === "completed" && t === "complete") return "Completed";
  if (s === "completed" && t === "out") return "Out";
  if (s === "started") return "Started";
  if (s === "failed") return "Failed";
  if (s === "canceled" || s === "cancelled" || s === "reversed") {
    return "Failed";
  }

  return s || "Unknown";
}

function statusClass(status: string, type?: string | null) {
  const value = surveyResult(status, type).toLowerCase();

  if (value === "completed" || value === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value === "out" || value === "started") {
    return "bg-amber-50 text-amber-700";
  }

  if (value === "failed") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function AdminUsers({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const list = useMemo(
    () =>
      users.filter(
        (u) =>
          `${u.name ?? ""} ${u.email} ${u.id}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === "all" ||
            (filter === "blocked" ? u.isBlocked : !u.isBlocked))
      ),
    [users, query, filter]
  );

  async function toggle(u: User) {
    setBusy(u.id);
    setMessage("");

    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: u.isBlocked ? "unblock" : "block",
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        throw Error(d.error);
      }

      setUsers((x) =>
        x.map((v) =>
          v.id === u.id
            ? {
                ...v,
                isBlocked: d.user.isBlocked,
              }
            : v
        )
      );

      setMessage(
        d.user.isBlocked
          ? "Account blocked successfully."
          : "Account unblocked successfully."
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Unable to update account."
      );
    } finally {
      setBusy(null);
    }
  }

  async function del(u: User) {
    if (
      !confirm(
        `Permanently delete ${u.email}? This cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(u.id);

    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: "DELETE",
      });

      const d = await r.json();

      if (!r.ok) {
        throw Error(d.error);
      }

      setUsers((x) => x.filter((v) => v.id !== u.id));
      setMessage("Account deleted permanently.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Unable to delete account."
      );
    } finally {
      setBusy(null);
    }
  }

  async function openDetails(u: User) {
    setDetailsLoading(true);
    setDetailsError("");
    setDetails(null);

    try {
      const r = await fetch(
        `/api/admin/users/${u.id}/details`,
        {
          cache: "no-store",
        }
      );

      const d = await r.json();

      if (!r.ok) {
        throw Error(d.error);
      }

      setDetails(d);
    } catch (e) {
      setDetailsError(
        e instanceof Error
          ? e.message
          : "Unable to load user details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <>
      <div className="motion-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                User management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage accounts, monitor earnings, review survey
                activity, and inspect withdrawals.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email or ID"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 sm:w-64"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All users</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {message && (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {message}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  User
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Balance
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Surveys
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Referrals
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Successful
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Failed
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Withdrawals
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Registered
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {list.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {u.name || "Unnamed user"}
                    </p>

                    <p className="text-sm text-slate-500">
                      {u.email}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">
                      {money(u.balance)}
                    </p>

                    <p className="text-xs text-slate-400">
                      Earned {money(u.totalEarnedUsd)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold">
                    {count(u.totalSurveys)}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {count(u.successfulReferrals)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {count(u.successfulSurveys)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {count(u.failedSurveys)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {count(u.withdrawalCount)} requests
                    </p>

                    <p className="text-xs text-slate-400">
                      Paid {money(u.totalWithdrawn)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.isBlocked
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {date(u.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={busy === u.id}
                        onClick={() => openDetails(u)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Details
                      </button>

                      <button
                        disabled={busy === u.id}
                        onClick={() => toggle(u)}
                        className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        {busy === u.id
                          ? "Working..."
                          : u.isBlocked
                            ? "Unblock"
                            : "Block"}
                      </button>

                      <button
                        disabled={busy === u.id}
                        onClick={() => del(u)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!list.length && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(detailsLoading || details || detailsError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
          onClick={() => {
            if (!detailsLoading) {
              setDetails(null);
              setDetailsError("");
            }
          }}
        >
          <div
            className="motion-card flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
                  User Details
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  {details?.user.name || "User account"}
                </h3>

                {details?.user.email && (
                  <p className="text-sm text-slate-500">
                    {details.user.email}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setDetails(null);
                  setDetailsError("");
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {detailsLoading && (
                <div className="py-16 text-center text-sm text-slate-500">
                  Loading complete user details...
                </div>
              )}

              {detailsError && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  {detailsError}
                </div>
              )}

              {details && (
                <div className="space-y-6">
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Current balance
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        {money(details.user.balance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Total surveys
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        {count(details.user.totalSurveys)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase text-emerald-600">
                        Successful
                      </p>

                      <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {count(details.user.successfulSurveys)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <p className="text-xs font-semibold uppercase text-red-600">
                        Failed
                      </p>

                      <p className="mt-2 text-2xl font-bold text-red-700">
                        {count(details.user.failedSurveys)}
                      </p>
                    </div>
 
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase text-amber-600">
                        Out
                      </p>

                      <p className="mt-2 text-2xl font-bold text-amber-700">
                        {count(details.user.outSurveys)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-semibold uppercase text-blue-600">
                        Started
                      </p>

                      <p className="mt-2 text-2xl font-bold text-blue-700">
                        {count(details.user.startedSurveys)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-xs font-semibold uppercase text-violet-600">
                        Successful referrals
                      </p>

                      <p className="mt-2 text-2xl font-bold text-violet-700">
                        {count(details.user.successfulReferrals)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase text-amber-600">
                        Pending referrals
                      </p>

                      <p className="mt-2 text-2xl font-bold text-amber-700">
                        {count(details.user.pendingReferrals)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Total earned
                      </p>

                      <p className="mt-2 text-xl font-bold">
                        {money(details.user.totalEarnedUsd)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Total withdrawn
                      </p>

                      <p className="mt-2 text-xl font-bold">
                        {money(details.user.totalWithdrawn)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Withdrawal requests
                      </p>

                      <p className="mt-2 text-xl font-bold">
                        {count(details.user.withdrawalCount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Paid withdrawals
                      </p>

                      <p className="mt-2 text-xl font-bold">
                        {count(details.user.paidWithdrawalCount)}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="font-bold">
                      Account information
                    </h4>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-400">
                          Name
                        </p>

                        <p className="mt-1 font-medium">
                          {details.user.name || "Unnamed user"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Email
                        </p>

                        <p className="mt-1 break-all font-medium">
                          {details.user.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          User ID
                        </p>

                        <p className="mt-1 break-all font-mono text-xs">
                          {details.user.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Status
                        </p>

                        <p className="mt-1 font-medium">
                          {details.user.isBlocked
                            ? "Blocked"
                            : "Active"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Registered
                        </p>

                        <p className="mt-1 font-medium">
                          {date(details.user.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Last updated
                        </p>

                        <p className="mt-1 font-medium">
                          {date(details.user.updatedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Login method
                        </p>

                        <p className="mt-1 font-medium">
                          {details.user.googleId
                            ? "Google + account"
                            : "Email / password"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Referral code
                        </p>

                        <p className="mt-1 break-all font-mono text-sm font-semibold">
                          {details.user.referralCode || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Referral earnings
                        </p>

                        <p className="mt-1 font-semibold text-violet-700">
                          {money(details.user.referralEarnings)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">
                          Referral activity
                        </h4>

                        <p className="text-sm text-slate-500">
                          People referred by this user and their qualification status.
                        </p>
                      </div>

                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        {details.referrals.length} referrals
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Referred</th>
                            <th className="px-4 py-3">Qualified</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {details.referrals.map((referral) => (
                            <tr key={referral.id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold">
                                  {referral.referredName || "Unnamed user"}
                                </p>

                                <p className="break-all text-xs text-slate-500">
                                  {referral.referredEmail}
                                </p>
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    referral.status === "qualified"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : referral.status === "pending"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {referral.status}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {date(referral.createdAt)}
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {referral.qualifiedAt
                                  ? date(referral.qualifiedAt)
                                  : "—"}
                              </td>
                            </tr>
                          ))}

                          {!details.referrals.length && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-8 text-center text-sm text-slate-500"
                              >
                                No referrals yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">
                          Survey attempts
                        </h4>

                        <p className="text-sm text-slate-500">
                          Every survey start recorded by Rivo, including attempts that have not received a CPX result yet.
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {details.surveyAttempts.length} attempts
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[950px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">Offer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Reward</th>
                            <th className="px-4 py-3">Transaction</th>
                            <th className="px-4 py-3">Started</th>
                            <th className="px-4 py-3">Completed</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {details.surveyAttempts.map((attempt) => (
                            <tr key={attempt.id}>
                              <td className="px-4 py-3 font-medium">
                                {attempt.offerId}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                    attempt.status,
                                    attempt.type
                                  )}`}
                                >
                                  {surveyResult(attempt.status, attempt.type)}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {attempt.type || "—"}
                              </td>

                              <td className="px-4 py-3">
                                {attempt.amountUsd == null
                                  ? "—"
                                  : money(attempt.amountUsd)}
                              </td>

                              <td className="px-4 py-3 break-all font-mono text-xs text-slate-500">
                                {attempt.transactionId || "—"}
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {date(attempt.startedAt)}
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {attempt.completedAt
                                  ? date(attempt.completedAt)
                                  : "—"}
                              </td>
                            </tr>
                          ))}

                          {!details.surveyAttempts.length && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-8 text-center text-sm text-slate-500"
                              >
                                No survey attempts recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">
                          Survey activity
                        </h4>

                        <p className="text-sm text-slate-500">
                          Complete transaction history recorded by CPX.
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {details.surveys.length} records
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[1050px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">
                              Transaction
                            </th>

                            <th className="px-4 py-3">
                              Offer
                            </th>

                            <th className="px-4 py-3">
                              Type
                            </th>

                            <th className="px-4 py-3">
                              Status
                            </th>

                            <th className="px-4 py-3">
                              Local amount
                            </th>

                            <th className="px-4 py-3">
                              USD
                            </th>

                            <th className="px-4 py-3">
                              IP
                            </th>

                            <th className="px-4 py-3">
                              Date
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {details.surveys.map((survey) => (
                            <tr key={survey.id}>
                              <td className="px-4 py-3 font-mono text-xs">
                                {survey.transactionId}
                              </td>

                              <td className="px-4 py-3">
                                {survey.offerId || "—"}
                              </td>

                              <td className="px-4 py-3">
                                {survey.type || "—"}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                    survey.status
                                  )}`}
                                >
                                  {String(survey.status).toLowerCase() === "completed"
                                    ? "Completed"
                                    : String(survey.status).toLowerCase() === "out"
                                      ? "Out"
                                      : "Failed"}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {survey.amountLocal}
                              </td>

                              <td className="px-4 py-3 font-semibold">
                                {survey.amountUsd === null
                                  ? "—"
                                  : money(survey.amountUsd)}
                              </td>

                              <td className="px-4 py-3 font-mono text-xs">
                                {survey.ipClick || "—"}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3">
                                {date(survey.createdAt)}
                              </td>
                            </tr>
                          ))}

                          {!details.surveys.length && (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-10 text-center text-slate-500"
                              >
                                No survey transactions recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">
                          Withdrawal activity
                        </h4>

                        <p className="text-sm text-slate-500">
                          Every withdrawal request and its current state.
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {details.withdrawals.length} requests
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[1250px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">
                              Withdrawal ID
                            </th>

                            <th className="px-4 py-3">
                              Gross
                            </th>

                            <th className="px-4 py-3">
                              Fee
                            </th>

                            <th className="px-4 py-3">
                              Net paid
                            </th>

                            <th className="px-4 py-3">
                              Currency
                            </th>

                            <th className="px-4 py-3">
                              Network address
                            </th>

                            <th className="px-4 py-3">
                              Status
                            </th>

                            <th className="px-4 py-3">
                              Provider
                            </th>

                            <th className="px-4 py-3">
                              Payout ID
                            </th>

                            <th className="px-4 py-3">
                              Failure reason
                            </th>

                            <th className="px-4 py-3">
                              Date
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {details.withdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id}>
                              <td className="px-4 py-3 font-mono text-xs">
                                {withdrawal.id}
                              </td>

                              <td className="px-4 py-3 font-semibold">
                                {money(withdrawal.amount)}
                              </td>

                              <td className="px-4 py-3 text-red-600">
                                {money(withdrawal.fee)}
                              </td>

                              <td className="px-4 py-3 font-bold text-emerald-700">
                                {money(withdrawal.netAmount)}
                              </td>

                              <td className="px-4 py-3">
                                {withdrawal.currency}
                              </td>

                              <td className="max-w-[240px] break-all px-4 py-3 font-mono text-xs">
                                {withdrawal.payoutAddress}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                    withdrawal.status
                                  )}`}
                                >
                                  {withdrawal.status}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {withdrawal.provider}
                              </td>

                              <td className="px-4 py-3 font-mono text-xs">
                                {withdrawal.providerPayoutId || "—"}
                              </td>

                              <td className="max-w-[220px] px-4 py-3 text-xs text-red-600">
                                {withdrawal.failureReason || "—"}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3">
                                {date(withdrawal.createdAt)}
                              </td>
                            </tr>
                          ))}

                          {!details.withdrawals.length && (
                            <tr>
                              <td
                                colSpan={11}
                                className="px-4 py-10 text-center text-slate-500"
                              >
                                No withdrawal requests recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

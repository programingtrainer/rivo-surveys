"use client";

import { useEffect, useMemo, useState } from "react";

type Withdrawal = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  amount: string;
  fee: string;
  netAmount: string;
  currency: string;
  payoutAddress: string;
  status: string;
  provider: string;
  providerPayoutId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  total: number;
  pending: number;
  processing: number;
  paid: number;
  failed: number;
  canceled: number;
  totalAmount: string;
  totalPaid: string;
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
};

export default function OperationsCenter() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    pending: 0,
    processing: 0,
    paid: 0,
    failed: 0,
    canceled: 0,
    totalAmount: "0",
    totalPaid: "0",
  });

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  const [reason, setReason] = useState("");

  async function loadOperations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/operations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load operations.");
      }

      setWithdrawals(data.withdrawals || []);
      setSummary(data.summary || {});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load operations."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOperations();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/operations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action: "approve",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to approve withdrawal.");
      }

      setSuccess("Withdrawal moved to processing.");
      await loadOperations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve withdrawal."
      );
    } finally {
      setBusyId("");
    }
  }

  async function reject() {
    if (!rejecting) return;

    setBusyId(rejecting.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/operations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: rejecting.id,
          action: "reject",
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to reject withdrawal.");
      }

      setSuccess("Withdrawal canceled and the amount was refunded.");
      setRejecting(null);
      setReason("");
      await loadOperations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject withdrawal."
      );
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return withdrawals.filter((item) => {
      const matchesStatus =
        status === "all" || item.status === status;

      if (!matchesStatus) return false;

      if (!query) return true;

      return (
        item.email.toLowerCase().includes(query) ||
        (item.name || "").toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.payoutAddress.toLowerCase().includes(query)
      );
    });
  }, [withdrawals, status, search]);

  function money(value: string | number) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Pending", summary.pending, "pending"],
          ["Processing", summary.processing, "processing"],
          ["Paid", summary.paid, "paid"],
          ["Total operations", summary.total, "all"],
        ].map(([label, value]) => (
          <button
            key={String(label)}
            type="button"
            onClick={() => setStatus(String(value === summary.total ? "all" : value === summary.pending ? "pending" : value === summary.processing ? "processing" : "paid"))}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </button>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Requested volume</p>
          <p className="mt-2 text-2xl font-bold">
            {money(summary.totalAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Paid to users</p>
          <p className="mt-2 text-2xl font-bold">
            {money(summary.totalPaid)}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search email, user, withdrawal ID or payout address..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>

          <button
            type="button"
            onClick={loadOperations}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading operations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">No operations found</p>
            <p className="mt-1 text-sm text-slate-500">
              There are no withdrawals matching the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Withdrawal</th>
                  <th className="px-5 py-4">Rivo fee</th>
                  <th className="px-5 py-4">User receives</th>
                  <th className="px-5 py-4">Payout</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {item.name || "Unnamed user"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.email}
                      </p>
                      <p className="mt-2 max-w-[170px] truncate font-mono text-[10px] text-slate-400">
                        {item.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {money(item.amount)} {item.currency}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {money(item.fee)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold">
                        {money(item.netAmount)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[180px] break-all font-mono text-xs text-slate-600">
                        {item.payoutAddress}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {item.provider}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                        {statusLabels[item.status] || item.status}
                      </span>

                      {item.failureReason && (
                        <p className="mt-2 max-w-[160px] text-xs text-red-600">
                          {item.failureReason}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {item.status === "pending" ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => approve(item.id)}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
                          >
                            {busyId === item.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => {
                              setRejecting(item);
                              setReason("");
                            }}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Reject withdrawal</h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will cancel the withdrawal and refund{" "}
              <strong>{money(rejecting.amount)}</strong> to the user wallet.
            </p>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setReason("");
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!reason.trim() || busyId === rejecting.id}
                onClick={reject}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {busyId === rejecting.id ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

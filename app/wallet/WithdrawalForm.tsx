"use client";

import { FormEvent, useMemo, useState } from "react";

const MIN_WITHDRAWAL = 15;
const MAX_DAILY_WITHDRAWAL = 30;
const FEE_RATE = 0.25;

export default function WithdrawalForm({
  balance,
}: {
  balance: number;
}) {
  const [amount, setAmount] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const amountNumber = Number(amount) || 0;
  const fee = useMemo(
    () => amountNumber * FEE_RATE,
    [amountNumber]
  );
  const netAmount = useMemo(
    () => amountNumber - fee,
    [amountNumber, fee]
  );

  function selectAmount(value: number) {
    setAmount(String(value));
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (amountNumber < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}.`);
      return;
    }

    if (amountNumber > MAX_DAILY_WITHDRAWAL) {
      setError(`Maximum withdrawal per day is $${MAX_DAILY_WITHDRAWAL}.`);
      return;
    }

    if (amountNumber > balance) {
      setError("Your balance is not enough for this withdrawal.");
      return;
    }

    if (!payoutAddress.trim()) {
      setError("Please enter your FaucetPay payout address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNumber,
          payoutAddress: payoutAddress.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create withdrawal.");
      }

      setMessage(
        "Withdrawal request submitted successfully. Processing usually takes within 12–24 hours."
      );
      setAmount("");
      setPayoutAddress("");

      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create withdrawal."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="withdrawal-amount"
            className="text-sm font-medium text-black/75"
          >
            Withdrawal amount
          </label>

          <span className="text-xs text-black/40">
            Available ${balance.toFixed(2)}
          </span>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-black/40">
            $
          </span>

          <input
            id="withdrawal-amount"
            type="number"
            min={MIN_WITHDRAWAL}
            max={Math.min(MAX_DAILY_WITHDRAWAL, balance)}
            step="0.01"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError("");
              setMessage("");
            }}
            placeholder="15.00"
            className="w-full rounded-2xl border border-black/10 bg-black/[0.02] py-3.5 pl-9 pr-4 text-sm outline-none transition focus:border-black/30 focus:bg-white"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[15, 20, 30].map((value) => {
            const disabled = value > balance;

            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => selectAmount(value)}
                className="rounded-xl border border-black/10 px-3 py-2 text-xs font-medium transition hover:border-black/25 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ${value}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="payout-address"
          className="mb-2 block text-sm font-medium text-black/75"
        >
          FaucetPay payout address
        </label>

        <input
          id="payout-address"
          type="text"
          value={payoutAddress}
          onChange={(event) => {
            setPayoutAddress(event.target.value);
            setError("");
            setMessage("");
          }}
          placeholder="Enter your FaucetPay address"
          autoComplete="off"
          className="w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3.5 text-sm outline-none transition focus:border-black/30 focus:bg-white"
        />
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/50">Withdrawal</span>
          <span>${amountNumber.toFixed(2)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-black/50">Rivo fee (25%)</span>
          <span>-${fee.toFixed(2)}</span>
        </div>

        <div className="my-3 border-t border-black/10" />

        <div className="flex items-center justify-between">
          <span className="font-medium">You receive</span>
          <span className="text-lg font-semibold">
            ${netAmount > 0 ? netAmount.toFixed(2) : "0.00"}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || balance < MIN_WITHDRAWAL}
        className="flex w-full items-center justify-center rounded-2xl bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Submitting..." : "Request withdrawal"}
      </button>

      <p className="text-center text-xs leading-5 text-black/40">
        Minimum $15 · Maximum $30 per day · 25% withdrawal fee
      </p>
    </form>
  );
}

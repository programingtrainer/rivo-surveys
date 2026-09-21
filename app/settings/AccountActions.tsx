"use client";

import { FormEvent, useState } from "react";

export default function AccountActions({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setPasswordError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(
          data.error || "Unable to change your password."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordMessage("Your password has been changed successfully.");
    } catch {
      setPasswordError(
        "Something went wrong. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = window.confirm(
      "This will permanently delete your account and associated wallet and session data. Continue?"
    );

    if (!secondConfirmation) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(
          data.error || "Unable to delete your account."
        );
        return;
      }

      window.location.href = "/login";
    } catch {
      setDeleteError(
        "Something went wrong. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
            Password
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Change password
          </h2>

          <p className="mt-2 text-sm leading-6 text-black/55">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium"
            >
              New password
            </label>

            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                placeholder="Enter your new password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-black/45 transition hover:text-black"
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4 10 8-0.5 1.4-1.4 2.8-2.6 4" />
                    <path d="M6.2 6.2C4.6 7.3 3.4 9 2 12c1.3 4 4.8 8 10 8 1.4 0 2.7-.3 3.8-.8" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium"
            >
              Confirm password
            </label>

            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                placeholder="Confirm your new password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-black/45 transition hover:text-black"
              >
                {showConfirmPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4 10 8-0.5 1.4-1.4 2.8-2.6 4" />
                    <path d="M6.2 6.2C4.6 6.2 3.4 9 2 12c1.3 4 4.8 8 10 8 1.4 0 2.7-.3 3.8-.8" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordLoading ? "Changing password..." : "Change password"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
            Session
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Sign out
          </h2>

          <p className="mt-2 text-sm leading-6 text-black/55">
            Sign out of your Rivo Surveys account on this device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="mt-6 rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {logoutLoading ? "Signing out..." : "Log out"}
        </button>
      </section>

      <section className="rounded-3xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-red-600/70">
            Danger zone
          </p>

          <h2 className="mt-2 text-xl font-semibold text-red-950">
            Delete account
          </h2>

          {isAdmin ? (
            <p className="mt-3 text-sm leading-6 text-red-900/65">
              Administrator accounts cannot be permanently deleted from the
              Rivo Surveys platform.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-red-900/65">
                Permanently delete your Rivo Surveys account and associated
                account data. This action cannot be undone.
              </p>

              {deleteError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="mt-6 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading
                  ? "Deleting account..."
                  : "Delete my account permanently"}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? "Signing out..." : "Login another account"}
    </button>
  );
}

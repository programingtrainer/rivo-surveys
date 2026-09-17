"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  key: string;
};

type AppHeaderProps = {
  displayName?: string;
  showAdmin?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/surveys", label: "Surveys", key: "surveys" },
  { href: "/challenges", label: "Challenges", key: "challenges" },
  { href: "/wallet", label: "Wallet", key: "wallet" },
  { href: "/settings", label: "Settings", key: "settings" },
];

export default function AppHeader({
  displayName = "Rivo User",
  showAdmin = false,
}: AppHeaderProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentIsAdmin, setCurrentIsAdmin] = useState(showAdmin);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (cancelled || !data?.user) return;

        setCurrentDisplayName(
          data.user.name || data.user.email || "Rivo User"
        );
        setCurrentIsAdmin(Boolean(data.user.isAdmin));
      } catch {
        // Keep the server-provided/default header state.
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const initial =
    currentDisplayName.trim().charAt(0).toUpperCase() || "R";

  const accountName =
    currentDisplayName.trim() || "Rivo User";

  const isActive = (key: string) => {
    if (key === "dashboard") return pathname === "/dashboard";
    return pathname.startsWith(`/${key}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:gap-6 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Rivo Surveys Dashboard"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-base font-black tracking-tight text-white shadow-sm transition duration-200 group-hover:scale-105">
            R
          </span>

          <span className="hidden text-lg font-bold tracking-tight text-gray-950 sm:inline sm:text-xl">
            Rivo Surveys
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          aria-label="Main navigation"
          className="flex min-w-0 items-center justify-center gap-0.5 overflow-x-auto scrollbar-none"
        >
          {navItems.map((item) => {
            const active = isActive(item.key);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition-all duration-200 sm:px-3.5 sm:text-sm ${
                  active
                    ? "bg-gray-100 font-semibold text-gray-950 shadow-sm"
                    : "font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {currentIsAdmin && (
            <Link
              href="/admin"
              aria-current={
                pathname.startsWith("/admin") ? "page" : undefined
              }
              className={`ml-1 shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 sm:text-sm ${
                pathname.startsWith("/admin")
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Profile */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:bg-gray-200 hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <span className="text-sm font-bold uppercase text-gray-700">
              {initial}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-black/10">
              <div className="border-b border-gray-100 px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {accountName}
                </p>
                <p className="text-xs text-gray-400">Rivo Account</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.55v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 8.1 15a1.7 1.7 0 0 0-1.56-1.03H6.45v-2.55h.09A1.7 1.7 0 0 0 8.1 10.4a1.7 1.7 0 0 0-.34-1.88L7.7 8.46l1.8-1.8.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5.4h2.55v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.09v2.55h-.09A1.7 1.7 0 0 0 19.4 15Z"
                  />
                </svg>
                Settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

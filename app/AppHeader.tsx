"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { href: "/wallet", label: "Wallet", key: "wallet" },
  { href: "/settings", label: "Settings", key: "settings" },
];

export default function AppHeader({
  displayName = "Rivo User",
  showAdmin = false,
}: AppHeaderProps) {
  const pathname = usePathname();

  const initial =
    displayName.trim().charAt(0).toUpperCase() || "R";

  const isActive = (key: string) => {
    if (key === "dashboard") return pathname === "/dashboard";
    return pathname.startsWith(`/${key}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
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

        <nav
          aria-label="Main navigation"
          className="absolute left-1/2 flex min-w-0 max-w-[calc(100%-7rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto scrollbar-none sm:max-w-[calc(100%-18rem)]"
        >
          {navItems.map((item) => {
            const active = isActive(item.key);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm transition-all duration-200 ${
                  active
                    ? "bg-gray-100 font-semibold text-gray-950 shadow-sm"
                    : "font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {showAdmin && (
            <Link
              href="/admin"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              className={`ml-1 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                pathname.startsWith("/admin")
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <Link
          href="/settings"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 transition duration-200 hover:scale-105 hover:bg-gray-200"
          aria-label="Account settings"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}

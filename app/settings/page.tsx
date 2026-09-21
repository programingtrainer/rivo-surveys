import Link from "next/link";
import { requireUser } from "@/lib/route-protection";
import { ADMIN_EMAIL } from "@/lib/config";
import AccountActions from "./AccountActions";
import AppHeader from "../AppHeader";

export default async function SettingsPage() {
  const user = await requireUser();
  const admin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const displayName =
    user.name?.trim() ||
    user.email.split("@")[0] ||
    "Rivo User";

  const initial = displayName.charAt(0).toUpperCase();

  const sections = [
    {
      id: "account",
      label: "Account",
      description: "Profile and account information",
    },
    {
      id: "security",
      label: "Security",
      description: "Password and account security",
    },
    {
      id: "surveys",
      label: "Surveys & Rewards",
      description: "Survey participation and rewards",
    },
    {
      id: "wallet",
      label: "Wallet & Payments",
      description: "Balance and payment information",
    },
    {
      id: "documentation",
      label: "Help & Documentation",
      description: "Guides and platform information",
    },
    {
      id: "legal",
      label: "Legal & Policies",
      description: "Terms and platform policies",
    },
    {
      id: "account-actions",
      label: "Password & Account",
      description: "Password, logout, and deletion",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111]">
      <AppHeader displayName={displayName} showAdmin={admin} />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-black/45">
            Account
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55 sm:text-base">
            Manage your Rivo Surveys account, security, rewards information,
            documentation, and policies.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-6">
            <div className="motion-card overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/10 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Settings
                </p>

                <p className="mt-2 text-sm font-semibold">
                  Manage your account
                </p>
              </div>

              <nav className="p-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex items-start gap-3 rounded-2xl px-4 py-3 transition hover:bg-[#f7f7f5]"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-black/20 transition group-hover:bg-black" />

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {section.label}
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-black/45">
                        {section.description}
                      </span>
                    </span>
                  </a>
                ))}

                {admin && (
                  <a
                    href="#administration"
                    className="group mt-1 flex items-start gap-3 rounded-2xl px-4 py-3 transition hover:bg-[#f7f7f5]"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-black transition" />

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        Administration
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-black/45">
                        Administrator controls
                      </span>
                    </span>
                  </a>
                )}
              </nav>

              <div className="border-t border-black/10 p-3">
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <section
              id="account"
              className="motion-card scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="mb-7">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Account
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Account information
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  View the account information currently associated with your
                  Rivo Surveys profile.
                </p>
              </div>

              <div className="flex flex-col gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-black text-xl font-semibold text-white">
                  {initial}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">
                    {displayName}
                  </h3>

                  <p className="mt-1 truncate text-sm text-black/50">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-black/40">
                    Account email
                  </p>

                  <p className="mt-2 break-all text-sm font-medium">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-black/40">
                    Authentication
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {user.googleId ? "Google account" : "Email and password"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-black/40">
                    Account status
                  </p>

                  <p className="mt-2 text-sm font-medium text-green-700">
                    Active
                  </p>
                </div>
              </div>
            </section>

            <section
              id="security"
              className="motion-card scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Security
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Account security
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  Review how your account authentication and password are
                  protected.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
                  <p className="text-sm font-semibold">
                    Secure sessions
                  </p>

                  <p className="mt-2 text-xs leading-5 text-black/50">
                    Authentication sessions are maintained using protected
                    server-side session records.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
                  <p className="text-sm font-semibold">
                    Password protection
                  </p>

                  <p className="mt-2 text-xs leading-5 text-black/50">
                    Passwords are processed as cryptographic hashes and are not
                    stored as plain text.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="surveys"
              className="motion-card scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Surveys & Rewards
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Surveys and rewards
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  Access information about surveys, eligibility, quality
                  requirements, and the reward system.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/surveys"
                  className="group rounded-2xl border border-black/10 p-5 transition hover:border-black/25 hover:bg-[#fafaf8]"
                >
                  <p className="text-sm font-semibold group-hover:underline">
                    Available Surveys
                  </p>

                  <p className="mt-2 text-xs leading-5 text-black/50">
                    View surveys currently available to your account.
                  </p>
                </Link>

                <Link
                  href="/rewards-policy"
                  className="group rounded-2xl border border-black/10 p-5 transition hover:border-black/25 hover:bg-[#fafaf8]"
                >
                  <p className="text-sm font-semibold group-hover:underline">
                    Survey & Rewards Policy
                  </p>

                  <p className="mt-2 text-xs leading-5 text-black/50">
                    Review eligibility, quality requirements, and rewards.
                  </p>
                </Link>
              </div>
            </section>

            <section
              id="wallet"
              className="motion-card scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Wallet & Payments
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Wallet and payments
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  Manage and review your Rivo Surveys balance and payment
                  information.
                </p>
              </div>

              <Link
                href="/wallet"
                className="group block rounded-2xl border border-black/10 p-5 transition hover:border-black/25 hover:bg-[#fafaf8]"
              >
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-sm font-semibold group-hover:underline">
                      Open Wallet
                    </p>

                    <p className="mt-2 text-xs leading-5 text-black/50">
                      View your balance and available wallet information.
                    </p>
                  </div>

                  <span className="text-black/35">
                    →
                  </span>
                </div>
              </Link>
            </section>

            <section
              id="documentation"
              className="motion-card scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Documentation
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Help & Documentation
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  Learn how Rivo Surveys works, how rewards are calculated,
                  and how to use the platform responsibly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/docs"
                  className="group rounded-2xl border border-black/10 p-5 transition hover:border-black/25 hover:bg-[#fafaf8]"
                >
                  <p className="text-sm font-semibold group-hover:underline">
                    Rivo Documentation
                  </p>

                  <p className="mt-2 text-xs leading-5 text-black/50">
                    Platform guide, surveys, rewards, wallet, and account
                    information.
                  </p>
                </Link>

                <Link
                  href="/docs/getting-started"
                  className="group rounded-2xl border border-black/10 p-5 transition hover:border-black/25 hover:bg-[#fafaf8]"
                >
                  <p className="text-sm font-semibold group-hover:underline">
                    Getting Started
                  </p>

                  <p className="mt-2 text-xs leading-5 text-black/50">
                    A simple guide to using Rivo Surveys from your first login.
                  </p>
                </Link>
              </div>
            </section>

            <section
              id="legal"
              className="motion-card scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  Legal
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Policies & Legal
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/55">
                  Review the rules governing your use of Rivo Surveys and how
                  information is handled.
                </p>
              </div>

              <div className="divide-y divide-black/10 rounded-2xl border border-black/10">
                <Link
                  href="/terms"
                  className="flex items-center justify-between gap-5 p-5 transition hover:bg-[#fafaf8]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Terms of Service
                    </p>

                    <p className="mt-1 text-xs text-black/50">
                      The terms governing your use of Rivo Surveys.
                    </p>
                  </div>

                  <span className="text-black/35">→</span>
                </Link>

                <Link
                  href="/privacy"
                  className="flex items-center justify-between gap-5 p-5 transition hover:bg-[#fafaf8]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Privacy Policy
                    </p>

                    <p className="mt-1 text-xs text-black/50">
                      How information is collected, used, protected, and
                      retained.
                    </p>
                  </div>

                  <span className="text-black/35">→</span>
                </Link>

                <Link
                  href="/acceptable-use"
                  className="flex items-center justify-between gap-5 p-5 transition hover:bg-[#fafaf8]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Acceptable Use Policy
                    </p>

                    <p className="mt-1 text-xs text-black/50">
                      Prohibited activities and responsible platform use.
                    </p>
                  </div>

                  <span className="text-black/35">→</span>
                </Link>

                <Link
                  href="/rewards-policy"
                  className="flex items-center justify-between gap-5 p-5 transition hover:bg-[#fafaf8]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Survey & Rewards Policy
                    </p>

                    <p className="mt-1 text-xs text-black/50">
                      Survey eligibility, quality requirements, and rewards.
                    </p>
                  </div>

                  <span className="text-black/35">→</span>
                </Link>
              </div>
            </section>

            <section
              id="account-actions"
              className="scroll-mt-6"
            >
              <AccountActions isAdmin={admin} />
            </section>

            {admin && (
              <section
                id="administration"
                className="scroll-mt-6 rounded-3xl border border-black/10 bg-black p-6 text-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-8"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                  Administration
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Administrator access
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Your account has administrative privileges for Rivo Surveys.
                </p>

                <Link
                  href="/admin"
                  className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Open Admin Panel
                </Link>
              </section>
            )}
          </div>
        </div>

        <footer className="mt-14 border-t border-black/10 pt-7 text-xs text-black/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Rivo Surveys. All rights reserved.</p>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/docs" className="hover:text-black">
                Documentation
              </Link>

              <Link href="/terms" className="hover:text-black">
                Terms
              </Link>

              <Link href="/privacy" className="hover:text-black">
                Privacy
              </Link>

              <Link href="/acceptable-use" className="hover:text-black">
                Acceptable Use
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

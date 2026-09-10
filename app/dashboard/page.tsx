import { isAdmin, getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const [user, admin] = await Promise.all([
    getCurrentUser(),
    isAdmin(),
  ]);

  const displayName =
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          <a
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Rivo Surveys Dashboard"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-base font-black tracking-tight text-white shadow-sm">
              R
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-950 sm:text-xl">
              Rivo Surveys
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="/dashboard"
              className="rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-950 transition hover:bg-gray-200"
            >
              Dashboard
            </a>

            <a
              href="/surveys"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            >
              Surveys
            </a>

            <a
              href="/wallet"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            >
              Wallet
            </a>

            <a
              href="/settings"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            >
              Settings
            </a>

            {admin && (
              <a
                href="/admin"
                className="ml-1 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Admin
              </a>
            )}
          </nav>

          <a
            href="/settings"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            aria-label="Account settings"
          >
            {displayName.charAt(0).toUpperCase()}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl bg-black px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-gray-400">
              Welcome back
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Hello, {displayName}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
              Find available surveys, complete them, and build your
              rewards balance.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/surveys"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Find surveys
              </a>

              <a
                href="/wallet"
                className="rounded-xl border border-gray-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                View wallet
              </a>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Available balance
              </p>

              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Wallet
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              $0.00
            </p>

            <a
              href="/wallet"
              className="mt-4 inline-block text-sm font-semibold text-black hover:underline"
            >
              Manage wallet
            </a>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Completed surveys
              </p>

              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Activity
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              0
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Your completed surveys will appear here.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total earned
              </p>

              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Rewards
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              $0.00
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Your lifetime survey earnings.
            </p>
          </div>
        </section>

        <section className="mt-7 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Get started
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Everything you need to start earning.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="/surveys"
                className="group rounded-xl border border-gray-200 p-5 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <p className="text-base font-semibold">
                  Available surveys
                </p>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  Browse surveys that are available for your account.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-black">
                  Browse surveys →
                </span>
              </a>

              <a
                href="/wallet"
                className="group rounded-xl border border-gray-200 p-5 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <p className="text-base font-semibold">
                  Your wallet
                </p>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  Check your balance and manage your rewards.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-black">
                  Open wallet →
                </span>
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Account
            </h2>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Signed in as
              </p>

              <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                {user?.email || "Account"}
              </p>
            </div>

            <a
              href="/settings"
              className="mt-4 block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold transition hover:bg-gray-50"
            >
              Account settings
            </a>

            {admin && (
              <a
                href="/admin"
                className="mt-3 block w-full rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Open Admin Panel
              </a>
            )}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-gray-400">
          Rivo Surveys
        </footer>
      </div>
    </main>
  );
}

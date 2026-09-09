import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import OperationsCenter from "./OperationsCenter";

export default async function OperationsPage() {
  if (!(await isAdmin())) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">
              Rivo Surveys
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Operations Center
            </h1>
          </div>

          <a
            href="/admin"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:bg-slate-50"
          >
            ← Administration
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Operations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage platform financial operations.
          </p>
        </div>

        <OperationsCenter />
      </div>
    </main>
  );
}

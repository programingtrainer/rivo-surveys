import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import AppHeader from "../../AppHeader";
import OperationsCenter from "./OperationsCenter";

export default async function OperationsPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/dashboard");
  }

  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader
        displayName={user?.name || user?.email || "Rivo Admin"}
        showAdmin
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">
              Operations Center
            </p>
            <h2 className="mt-1 text-2xl font-bold">Operations</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review and manage platform financial operations.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-slate-50"
          >
            ← Administration
          </a>
        </div>

        <OperationsCenter />
      </div>
    </main>
  );
}

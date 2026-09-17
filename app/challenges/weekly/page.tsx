import Link from "next/link";
import AppHeader from "../../AppHeader";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { cpxTransactions, users } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";

function startOfWeek(date = new Date()) {
  // Rivo's weekly boundary follows Asia/Riyadh (UTC+3).
  const d = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const day = d.getUTCDay(); const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff); d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - 3 * 60 * 60 * 1000);
}
function Trophy({ rank }: { rank: number }) { return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">{rank}</span>; }

export default async function WeeklyChallengesPage() {
  const [user, admin] = await Promise.all([getCurrentUser(), isAdmin()]);
  if (!user) return null;
  const weekStart = startOfWeek();
  const rows = await db.select({
    userId: cpxTransactions.userId,
    name: users.name,
    email: users.email,
    surveys: sql<number>`count(*) filter (where lower(${cpxTransactions.status}) = 'completed' and lower(coalesce(${cpxTransactions.type}, '')) = 'complete')`,
    earned: sql<string>`coalesce(sum(${cpxTransactions.amountUsd}) filter (where lower(${cpxTransactions.status}) = 'completed' and lower(coalesce(${cpxTransactions.type}, '')) = 'complete'), 0)`,
  }).from(cpxTransactions).innerJoin(users, eq(cpxTransactions.userId, users.id)).where(and(gte(cpxTransactions.createdAt, weekStart))).groupBy(cpxTransactions.userId, users.name, users.email).orderBy(sql`surveys desc, earned desc`).limit(50);
  const myIndex = rows.findIndex((r) => r.userId === user.id); const myRow = myIndex >= 0 ? rows[myIndex] : null;
  return <main className="min-h-screen bg-[#fafaf8] text-black">
    <AppHeader displayName={user.name || user.email} showAdmin={admin} />
    <div className="rivo-container pb-16 pt-8 sm:pt-10">
      <section className="rounded-[2rem] bg-black px-6 py-9 text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)] sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Weekly Challenge</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Compete. Complete. Earn.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">This leaderboard tracks completed CPX surveys from Monday through Sunday. Rankings update from recorded survey activity.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/surveys" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90">Find surveys</Link><Link href="/challenges" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Back to challenges</Link></div>
      </section>
      <section className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">Leaderboard</p><h2 className="mt-2 text-2xl font-semibold">This week</h2></div><span className="text-xs text-black/40">Top 50</span></div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
            {rows.length === 0 ? <div className="p-8 text-center text-sm text-black/50">No completed surveys have been recorded this week yet.</div> : rows.map((row, index) => <div key={row.userId} className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${index ? "border-t border-black/5" : ""} ${row.userId === user.id ? "bg-black/[0.035]" : "bg-white"}`}><Trophy rank={index + 1}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{(row.name || row.email?.split("@")[0] || "Rivo member")}{row.userId === user.id ? " · You" : ""}</p><p className="mt-1 text-xs text-black/45">{Number(row.surveys)} completed surveys</p></div><div className="text-right"><p className="text-sm font-bold">${Number(row.earned).toFixed(2)}</p><p className="text-[11px] text-black/40">earned</p></div></div>)}
          </div>
        </div>
        <aside className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">Your progress</p><h2 className="mt-2 text-2xl font-semibold">{myRow ? `#${myIndex + 1}` : "Not ranked"}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black/[0.035] p-4"><p className="text-xs text-black/45">Completed</p><p className="mt-2 text-2xl font-bold">{Number(myRow?.surveys ?? 0)}</p></div><div className="rounded-2xl bg-black/[0.035] p-4"><p className="text-xs text-black/45">Earned</p><p className="mt-2 text-2xl font-bold">${Number(myRow?.earned ?? 0).toFixed(2)}</p></div></div>
          <div className="mt-6 border-t border-black/10 pt-6"><h3 className="font-semibold">How it works</h3><ul className="mt-3 space-y-3 text-sm leading-6 text-black/55"><li>• Only recorded completed CPX surveys count.</li><li>• The challenge resets at the start of each week.</li><li>• The leaderboard is informational; publish prize terms before offering a prize.</li></ul></div>
        </aside>
      </section>
    </div>
  </main>;
}

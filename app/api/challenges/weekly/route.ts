import { NextResponse } from "next/server";
import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cpxTransactions, users, weeklyChallengePrizes, weeklyChallengeWinners, weeklyChallenges } from "@/lib/schema";
import { settleExpiredWeeklyChallenges } from "@/lib/weekly-challenges";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await settleExpiredWeeklyChallenges();
  const now = new Date();
  const challenges = await db.select().from(weeklyChallenges).where(lte(weeklyChallenges.startsAt, now)).orderBy(weeklyChallenges.startsAt);
  const active = challenges.filter((c) => c.expiresAt > now && c.status !== "settled");
  const results = [];

  for (const challenge of active) {
    const metric = challenge.challengeType === "most_earnings" || challenge.challengeType === "earnings_target"
      ? sql`coalesce(sum(${cpxTransactions.amountUsd}), 0)`
      : sql`count(*)`;
    const rows = await db.select({
      userId: cpxTransactions.userId,
      name: users.name,
      email: users.email,
      value: metric,
    }).from(cpxTransactions).innerJoin(users, eq(cpxTransactions.userId, users.id)).where(and(
      gte(cpxTransactions.createdAt, challenge.startsAt),
      lt(cpxTransactions.createdAt, challenge.expiresAt),
      eq(cpxTransactions.status, "completed"),
      sql`lower(coalesce(${cpxTransactions.type}, '')) = 'complete'`,
    )).groupBy(cpxTransactions.userId, users.name, users.email).orderBy(sql`${metric} desc, ${cpxTransactions.userId} asc`).limit(100);

    const prizes = await db.select().from(weeklyChallengePrizes).where(eq(weeklyChallengePrizes.challengeId, challenge.id));
    const winnerRows = await db.select({ rank: weeklyChallengeWinners.rank, rewardUsd: weeklyChallengeWinners.rewardUsd })
      .from(weeklyChallengeWinners).where(eq(weeklyChallengeWinners.challengeId, challenge.id));
    const myIndex = rows.findIndex((r) => r.userId === user.id);
    const myValue = myIndex >= 0 ? Number(rows[myIndex].value) : 0;
    const target = Number(challenge.target ?? 0);

    results.push({
      challenge: {
        id: challenge.id, title: challenge.title, description: challenge.description,
        challengeType: challenge.challengeType, target: challenge.target, rewardUsd: challenge.rewardUsd,
        startsAt: challenge.startsAt, expiresAt: challenge.expiresAt,
      },
      leaderboard: rows.map((r, i) => ({ rank: i + 1, userId: r.userId, name: r.name || r.email.split("@")[0], value: Number(r.value) })),
      prizes: prizes.map((p) => ({ rank: Number(p.rank), rewardUsd: Number(p.rewardUsd) })),
      winners: winnerRows.map((w) => ({ rank: Number(w.rank), rewardUsd: Number(w.rewardUsd) })),
      me: { rank: myIndex >= 0 ? myIndex + 1 : null, value: myValue, target, completed: target > 0 && myValue >= target },
    });
  }

  return NextResponse.json({ challenges: results });
}
